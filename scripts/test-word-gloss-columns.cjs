'use strict';
// Verificar XML real de Word: glosario en párrafos y en columnas auténticas.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
function entry(buffer,target){
 let pos=0;
 while(pos+30<=buffer.length&&buffer.readUInt32LE(pos)===0x04034b50){
  const size=buffer.readUInt32LE(pos+18),n=buffer.readUInt16LE(pos+26),extra=buffer.readUInt16LE(pos+28);
  const name=buffer.toString('utf8',pos+30,pos+30+n),from=pos+30+n+extra;
  if(name===target){assert.equal(buffer.readUInt16LE(pos+8),0);return buffer.toString('utf8',from,from+size);}
  pos=from+size;
 }
 throw Error('No existe componente DOCX '+target);
}
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/,'')||'index.html');
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(e,data)=>{if(e){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.json')?'application/json; charset=utf-8':'application/octet-stream');res.end(data)});
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({headless:true});
 try{
  for(const filename of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1180,height:850}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/'+filename,{waitUntil:'load'});
    await page.waitForFunction(()=>typeof window.exportWord==='function'&&!!document.getElementById('course'));
    for(const course of ['latin1','latin4','greek1']){
     const result=await page.evaluate(async course=>{
      const set=document.getElementById('course');set.value=course;set.dispatchEvent(new Event('change',{bubbles:true}));
      const unit=course==='greek1'?'UD8':'UD3';
      const boxes=[...document.querySelectorAll('#unitChoices input.unit-choice')];
      for(const el of boxes)el.checked=units[Number(el.value)]===unit;
      boxes.find(el=>el.checked)?.dispatchEvent(new Event('change',{bubbles:true}));
      const sentences=document.getElementById('newSentences');
      sentences.value=course==='greek1'?'ὁ ἄνθρωπος λόγον λέγει.':'Puella et servus laborant. Puella amat.';
      sentences.dispatchEvent(new Event('input',{bubbles:true}));
      generate();
      window.ExaminaFlushSentenceGlossary?.();
      const count=document.querySelectorAll('#paper .final-gloss .gloss-item').length;
      const before=document.getElementById('paper').innerText;
      const download=window.downloadBlob;
      const review=window.ExaminaTeacherReview,old=review?.evidenceMayExport;
      const scoring=window.ExaminaScoring,prior=scoring?.canExport;
      let blob;
      try{
       if(review)review.evidenceMayExport=()=>true;
       if(scoring)scoring.canExport=()=>true;
       downloadBlob=(_filename,value)=>{blob=value;};
       exportWord(false);
      }finally{
       downloadBlob=download;
       if(review)review.evidenceMayExport=old;
       if(scoring)scoring.canExport=prior;
      }
      if(!blob)throw Error('No se ha generado un Word');
      return {count,before,bytes:Array.from(new Uint8Array(await blob.arrayBuffer()))};
     },course);
     const context=filename+'/'+course;
     assert(result.count>0,context+': falta glosario en la vista previa');
     const xml=entry(Buffer.from(result.bytes),'word/document.xml');
     assert.match(xml,/<w:cols w:num="2" w:space="360"\/>/,context+': faltan columnas reales');
     const first=xml.indexOf('<w:cols w:num="1" w:space="360"/>');
     const second=xml.indexOf('<w:cols w:num="2" w:space="360"/>',first);
     assert(first>=0&&second>first,context+': secciones no consecutivas');
     const contents=xml.slice(first,second);
     assert((contents.match(/<w:p>/g)||[]).length>=result.count,
      context+': no hay un párrafo Word por entrada');
     assert(!contents.includes('<w:tbl>'),context+': glosario sigue siendo tabla Word');
     assert(xml.endsWith('</w:sectPr></w:body></w:document>'),context+': sección final incompleta');
     assert.match(xml,/<w:footerReference w:type="default" r:id="rId3"\/>/,
      context+': pie de página desaparecido en sección continua');
     assert(xml.includes('<w:pgMar w:top="1417" w:right="1701" w:bottom="1417" w:left="1417" w:footer="560"/>'),
      context+': se perdieron los márgenes académicos');
    }
    assert.deepEqual(errors,[],filename+': fallo de JavaScript');
   }finally{await page.close();}
  }
  console.log('Glosario Word: párrafos en columnas reales, márgenes, pies y exámenes sin regresiones.');
 }finally{await browser.close();await new Promise(ok=>server.close(ok));}
})().catch(e=>{console.error(e);process.exitCode=1;});

'use strict';
// Regresión de fuentes del DOCX: sin alterar el motor de examen ni los bancos.
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
function zipPart(buffer,target){
 let offset=0;
 while(offset+30<=buffer.length&&buffer.readUInt32LE(offset)===0x04034b50){
  const length=buffer.readUInt32LE(offset+18),nl=buffer.readUInt16LE(offset+26),ex=buffer.readUInt16LE(offset+28);
  const name=buffer.toString('utf8',offset+30,offset+30+nl),start=offset+30+nl+ex;
  if(name===target){assert.equal(buffer.readUInt16LE(offset+8),0);return buffer.toString('utf8',start,start+length);}
  offset=start+length;
 }
 throw Error('No se encontró '+target);
}
const server=http.createServer((request,response)=>{
 const name=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname).replace(/^\/+/,'')||'index.html';
 const file=path.resolve(root,name);
 if(!file.startsWith(root+path.sep)){response.writeHead(403).end();return;}
 fs.readFile(file,(error,content)=>{
  if(error){response.writeHead(404).end();return;}
  response.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':
   file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.json')?'application/json; charset=utf-8':'application/octet-stream');
  response.end(content);
 });
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1180,height:850}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/'+file,{waitUntil:'load'});
    await page.waitForFunction(()=>typeof window.exportWord==='function'&&!!document.getElementById('course'));
    for(const course of ['latin1','latin4','greek1']){
     const result=await page.evaluate(async course=>{
      const set=document.getElementById('course');set.value=course;set.dispatchEvent(new Event('change',{bubbles:true}));
      generate();
      const previous=downloadBlob;let blob;
      const review=window.ExaminaTeacherReview,old=review?.evidenceMayExport;
      const scoring=window.ExaminaScoring,prior=scoring?.canExport;
      try{
       if(review)review.evidenceMayExport=()=>true;
       if(scoring)scoring.canExport=()=>true;
       downloadBlob=(_name,b)=>{blob=b};
       exportWord(false);
      }finally{
       downloadBlob=previous;
       if(review)review.evidenceMayExport=old;
       if(scoring)scoring.canExport=prior;
      }
      if(!blob)throw Error('No hubo Word generado');
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
     },course);
     const bytes=Buffer.from(result),styles=zipPart(bytes,'word/styles.xml');
     const footer=zipPart(bytes,'word/footer1.xml');
     const documentXml=zipPart(bytes,'word/document.xml');
     const name=file+'/'+course;
     const font='Palatino Linotype';
     assert(styles.includes('<w:style w:type="paragraph" w:default="1" w:styleId="Normal">'),name+': falta estilo Normal');
     assert.match(styles,/<w:rPrDefault><w:rPr><w:rFonts w:ascii="Palatino Linotype" w:hAnsi="Palatino Linotype" w:eastAsia="Palatino Linotype" w:cs="Palatino Linotype"\/>/,name+': DOCX sin fuente predeterminada completa');
     for(const id of ['Normal','Heading1','Heading2','Heading3']){
      const st=styles.match(new RegExp('<w:style[^>]*w:styleId="'+id+'"[^>]*>([\\s\\S]*?)<\\/w:style>'));
      assert(st&&st[1].includes('<w:rFonts w:ascii="'+font+'"'),name+': '+id+' sin Palatino Linotype');
     }
     assert(footer.includes('<w:rFonts w:ascii="'+font+'"'),name+': el pie de página no usa Palatino Linotype');
     assert(documentXml.includes('<w:body>'),name+': documento Word vacío');
     assert(!/Aptos|Calibri/.test(styles),name+': fuente no deseada');
    }
    assert.deepEqual(errors,[],file+': error de JavaScript');
   }finally{await page.close();}
  }
  console.log('Palatino Linotype consistente en normal, títulos y pies (latín I/4 y griego, web/offline).');
 }finally{await browser.close();await new Promise(ok=>server.close(ok));}
})().catch(e=>{console.error(e);process.exitCode=1;});

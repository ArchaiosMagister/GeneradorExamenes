'use strict';
// Presentación de la revisión filológica: sin cambiar candidatos ni decisiones.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const source=['index.html','offline.html'].map(file=>fs.readFileSync(path.join(root,file),'utf8'));
const mark='<style id="examina-lemma-review-theme">';
const style=html=>{const from=html.indexOf(mark),to=html.indexOf('</style>',from);assert(from>0&&to>from);return html.slice(from,to+8);};
assert.equal(style(source[0]),style(source[1]),'Temas distintos entre web y autónoma');
assert(style(source[0]).includes('@media screen {'),'Las tarjetas son solo de pantalla');
assert(!style(source[0]).includes('@media print'),'Sin alteración de Word/PDF');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/,'')||'index.html');
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(e,data)=>{if(e){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':
 file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.json')?'application/json; charset=utf-8':'application/octet-stream');res.end(data)});
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1280,height:900}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/'+file,{waitUntil:'load'});
    await page.waitForFunction(()=>!!document.getElementById('newSentences'));
    await page.evaluate(()=>{
     for(const [id,value] of [['course','latin1'],['model','mixto']]){
      const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));
     }
     const input=document.getElementById('newSentences');input.value='Galli pugnant.\nBona sunt.';
     input.dispatchEvent(new Event('input',{bubbles:true}));generate();
    });
    await page.waitForFunction(()=>document.querySelectorAll('#examSentenceGlossary .exam-gloss-lemma').length>=2);
    for(const width of [1280,820,390]){
     await page.setViewportSize({width,height:980});
     // En iPad/móvil el panel de vista previa es una pestaña, no está visible por defecto.
     if(width<=900)await page.locator('#examPreviewTab').click();
     for(const appearance of ['light','dark','oled']){
      const display=await page.evaluate(appearance=>{
       document.documentElement.dataset.appearance=appearance;
       const panel=document.querySelector('#examSentenceGlossary .exam-gloss-review-workspace');
       const rows=[...panel.querySelectorAll('.exam-gloss-review-choice')];
       const box=panel.getBoundingClientRect();
       return {
        present:!!panel&&getComputedStyle(panel).display==='grid',
        title:panel.querySelector('h4')?.textContent,
        choices:rows.length,
        noOverflow:rows.every(row=>{
         const r=row.getBoundingClientRect();
         const sel=row.querySelector('select').getBoundingClientRect();
         return r.width>0&&r.left>=box.left-1&&r.right<=box.right+1&&
          sel.left>=r.left-1&&sel.right<=r.right+1;
        }),
        selects:rows.every(row=>!!row.querySelector('.exam-review-form')&&!!row.querySelector('.exam-review-source')&&row.querySelector('select')?.options.length>1),
        ink:getComputedStyle(panel).color,
        bg:getComputedStyle(panel).backgroundColor
       };
      },appearance);
      const where=file+'/'+width+'/'+appearance;
      assert(display.present&&display.title.includes('Revisión'),where+': falta panel coherente');
      assert(display.choices>=2&&display.selects,where+': faltan candidatos o selectores');
      assert(display.noOverflow,where+': hay desbordamiento de tarjetas');
      assert.notEqual(display.ink,display.bg,where+': texto invisible');
     }
    }
    const original=await page.locator('#examSentenceGlossary .exam-gloss-review-choice').filter({hasText:'Galli'}).first().locator('select option').allTextContents();
    assert(original.some(x=>x.includes('Gallus')),file+': se perdió el banco de lemas');
    const choice=page.locator('#examSentenceGlossary .exam-gloss-review-choice').filter({hasText:'Galli'}).first();
    const value=await choice.locator('option').filter({hasText:'Gallus, –a, –um'}).first().getAttribute('value');
    await choice.locator('select').selectOption(value);
    assert(await page.locator('#examSentenceGlossary .exam-gloss-selected').count(),file+': no persistió elección');
    await page.locator('#examSentenceGlossary .exam-gloss-reset').first().click();
    assert(await page.locator('#examSentenceGlossary .exam-gloss-review-choice').filter({hasText:'Galli'}).count(),file+': no se puede cambiar lema');
    assert.deepEqual(errors,[],file+': error de JavaScript');
   }finally{await page.close();}
  }
  console.log('Tarjetas de revisión legibles en claro/oscuro/OLED, 3 anchuras, sin alterar elecciones ni bancos.');
 }finally{await browser.close();await new Promise(ok=>server.close(ok));}
})().catch(e=>{console.error(e);process.exitCode=1;});

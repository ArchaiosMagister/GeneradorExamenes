'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'export-workspace.js'),'utf8');
assert(source.includes('function configurePanelShortcuts()'),'Faltan los accesos rápidos');
assert(source.includes('/* Inspector de examen: densidad equilibrada'),'Falta CSS del inspector');
assert(source.includes('@media screen {'),'La compactación debe limitarse a pantalla');
const server=http.createServer((request,response)=>{
 const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname).replace(/^\/+/,'')||'index.html';
 const file=path.resolve(root,pathname);
 if(!file.startsWith(root+path.sep)){response.writeHead(403).end();return}
 fs.readFile(file,(error,data)=>{
  if(error){response.writeHead(404).end();return}
  response.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':
   file.endsWith('.js')?'text/javascript; charset=utf-8':
   file.endsWith('.json')?'application/json; charset=utf-8':'application/octet-stream');
  response.end(data);
 });
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({headless:true});
 try {
  for(const filename of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1440,height:820}});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/'+filename,{waitUntil:'load'});
    await page.waitForFunction(()=>!!document.getElementById('examPanelShortcuts')&&
     !!document.getElementById('examQuestionMenus')&&!!document.getElementById('examVisualSettings'));
    const initial=await page.evaluate(()=>({
     form:[document.getElementById('course').value,document.getElementById('model').value,
       document.getElementById('lang').value],
     paper:document.getElementById('paper').innerHTML,
     score:window.ExaminaScoring?.total?.(),
     ids:[...document.querySelectorAll('#examPanelShortcuts>button')].map(b=>b.dataset.target),
     headingMin:parseFloat(getComputedStyle(document.querySelector('#examQuestionMenus>details>summary')).minHeight)
    }));
    for(const target of ['exam-ui-core','examQuestionSettings','examScoring','examVisualSettings','group-drafts'])
     assert(initial.ids.includes(target),filename+': acceso ausente '+target);
    assert.equal(new Set(initial.ids).size,initial.ids.length,filename+': accesos duplicados');
    assert(initial.headingMin<=43,filename+': altura mínima de preguntas no compactada');
    for(const target of ['examVisualSettings','group-drafts','examQuestionSettings','examScoring']){
     await page.locator('#examPanelShortcuts>button[data-target="'+target+'"]').click();
     const state=await page.evaluate(id=>({
      open:document.getElementById(id)?.open,
      paper:document.getElementById('paper').innerHTML,
      score:window.ExaminaScoring?.total?.(),
      form:[document.getElementById('course').value,document.getElementById('model').value,
        document.getElementById('lang').value]
     }),target);
     if(['examVisualSettings','group-drafts'].includes(target))
      assert.equal(state.open,true,filename+': no se abre el apartado '+target);
     assert.equal(state.paper,initial.paper,filename+': saltar a '+target+' alteró el examen');
     assert.equal(state.score,initial.score,filename+': saltar a '+target+' alteró la puntuación');
     assert.deepEqual(state.form,initial.form,filename+': saltar a '+target+' modificó selectores');
    }
    for(const width of [1440,1024,820,390,320]){
     await page.setViewportSize({width,height:820});
     for(const mode of ['light','dark','oled']){
      const got=await page.evaluate(mode=>{
       document.documentElement.dataset.appearance=mode;
       const shell=document.getElementById('exam-ui-shell');
       const nav=document.getElementById('examPanelShortcuts');
       const buttons=[...nav.children];
       const summary=document.querySelector('#examQuestionMenus>details>summary');
       const style=getComputedStyle(summary);
       const hidden=getComputedStyle(nav).display==='none';
       return {hidden,number:buttons.length,fit:buttons.every(b=>
        b.scrollWidth<=b.clientWidth+2&&b.scrollHeight<=b.clientHeight+2),
        headingMin:parseFloat(style.minHeight),
        headingFits:summary.scrollHeight<=summary.clientHeight+2,
        foreground:style.color,background:style.backgroundColor,
        panelFit:shell.getBoundingClientRect().right<=innerWidth+2
       };
      },mode);
      const where=filename+'/'+width+'/'+mode;
      assert.equal(got.number,5,where+': deben conservarse cinco accesos');
      assert.equal(got.hidden,width<=950,where+': navegación rápida solo en escritorio');
      if(width>950)assert(got.fit,where+': accesos recortados');
      if(width<=760)assert(got.headingMin>=44,where+': altura táctil insuficiente');
      else assert(got.headingMin<=43,where+': cabecera de preguntas demasiado alta');
      assert(got.headingFits,where+': título de pregunta recortado');
      assert(got.panelFit,where+': panel fuera de pantalla');
      assert.notEqual(got.foreground,got.background,where+': contraste de cabecera');
     }
    }
    await page.setViewportSize({width:1440,height:820});
    await page.locator('#lang').selectOption('va');
    await page.waitForFunction(()=>document.querySelector('#examPanelShortcuts>[data-target="examQuestionSettings"]')?.textContent==='Preguntes');
    assert.equal(await page.locator('#examPanelShortcuts>[data-target="examVisualSettings"]').innerText(),
      'Format',filename+': falta traducción de acceso a formato');
    assert.deepEqual(errors,[],filename+': errores JS');
   } finally {await page.close()}
  }
  console.log('Sidebar: 5 accesos seguros, 5 anchuras, 3 apariencias, valenciano, sin regeneración (web/autónoma)');
 } finally {await browser.close();await new Promise(ok=>server.close(ok))}
})().catch(err=>{console.error(err);process.exitCode=1});

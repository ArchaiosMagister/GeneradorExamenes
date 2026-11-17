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
    const panelState=async()=>page.evaluate(()=>{
     const ids=['exam-ui-core','examQuestionSettings','examScoring','examVisualSettings','group-drafts'];
     const visible=id=>{
      const node=document.getElementById(id);
      return !!node&&getComputedStyle(node).display!=='none'&&node.getBoundingClientRect().height>0;
     };
     return {
      chosen:document.getElementById('examEditorPanel').dataset.editorSection,
      visible:ids.filter(visible),
      backups:visible('examinaUnifiedBackup'),
      pressed:[...document.querySelectorAll('#examPanelShortcuts>button[aria-pressed="true"]')].map(b=>b.dataset.target),
      paper:document.getElementById('paper').innerHTML,
      score:window.ExaminaScoring?.total?.(),
      form:['course','model','lang'].map(id=>document.getElementById(id).value)
     };
    });
    const first=await panelState();
    assert.equal(first.chosen,'exam-ui-core',filename+': debe comenzar en Configuración');
    assert.deepEqual(first.visible,['exam-ui-core'],filename+': se muestran secciones no seleccionadas al iniciar');
    assert.deepEqual(first.pressed,['exam-ui-core'],filename+': indicador activo inicial incorrecto');
    assert(!first.backups,filename+': copia completa fuera de Borradores');
    for(const target of ['examQuestionSettings','examScoring','examVisualSettings','group-drafts','exam-ui-core']){
     await page.locator('#examPanelShortcuts>button[data-target="'+target+'"]').click();
     const state=await panelState();
     assert.equal(state.chosen,target,filename+': pestaña no activada '+target);
     assert.deepEqual(state.visible,[target],filename+': no queda exclusivamente '+target);
     assert.deepEqual(state.pressed,[target],filename+': indicador incorrecto '+target);
     const marker=await page.evaluate(()=>{
      const active=document.querySelector('#examPanelShortcuts>button[aria-pressed="true"]');
      const inactive=document.querySelector('#examPanelShortcuts>button[aria-pressed="false"]');
      const a=getComputedStyle(active),b=getComputedStyle(inactive);
      return {background:a.backgroundColor,inactive:b.backgroundColor,color:a.color,
       shadow:a.boxShadow,weight:parseFloat(a.fontWeight)};
     });
     assert.notEqual(marker.background,marker.inactive,filename+': la pestaña activa no se distingue '+target);
     assert.equal(marker.color,'rgb(255, 255, 255)',filename+': falta contraste del texto activo '+target);
     assert(marker.shadow.includes('inset'),filename+': falta subrayado interior activo '+target);
     assert(marker.weight>=800,filename+': falta énfasis tipográfico activo '+target);
     assert.equal(state.backups,target==='group-drafts',filename+': copia completa mal ubicada');
     if(['examVisualSettings','group-drafts'].includes(target))
      assert.equal(await page.locator('#'+target).evaluate(el=>el.open),true,
       filename+': no se abre el apartado '+target);
     assert.equal(state.paper,initial.paper,filename+': cambiar a '+target+' alteró el examen');
     assert.equal(state.score,initial.score,filename+': cambiar a '+target+' alteró la puntuación');
     assert.deepEqual(state.form,initial.form,filename+': cambiar a '+target+' modificó selectores');
    }
    // Un campo original sigue conservando su valor aunque su panel se oculte.
    await page.locator('#name').fill('CONTROL_DE_PESTANAS');
    await page.locator('#examPanelShortcuts>button[data-target="examQuestionSettings"]').click();
    await page.locator('#examPanelShortcuts>button[data-target="exam-ui-core"]').click();
    assert.equal(await page.locator('#name').inputValue(),'CONTROL_DE_PESTANAS',
     filename+': la pestaña destruyó la edición de configuración');
    // En móvil se conserva el editor anterior: no se aplica la exclusividad.
    await page.locator('#examPanelShortcuts>button[data-target="examScoring"]').click();
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
        panelFit:shell.getBoundingClientRect().right<=innerWidth+2,
        activeBackground:getComputedStyle(nav.querySelector('[aria-pressed="true"]')).backgroundColor,
        activeForeground:getComputedStyle(nav.querySelector('[aria-pressed="true"]')).color,
        inactiveBackground:getComputedStyle(nav.querySelector('[aria-pressed="false"]')).backgroundColor
       };
      },mode);
      const where=filename+'/'+width+'/'+mode;
      assert.equal(got.number,5,where+': deben conservarse cinco accesos');
      assert.equal(got.hidden,width<=950,where+': navegación rápida solo en escritorio');
      const mobileState=await page.evaluate(()=>({
       core:getComputedStyle(document.getElementById('exam-ui-core')).display,
       score:getComputedStyle(document.getElementById('examScoring')).display
      }));
      if(width<=950)assert.notEqual(mobileState.core,'none',
       where+': la selección del escritorio ocultó Configuración en iPad/móvil');
      if(width>950)assert(got.fit,where+': accesos recortados');
      if(width>950){
       assert.notEqual(got.activeBackground,got.inactiveBackground,
        where+': botón activo visualmente idéntico al inactivo');
       assert.equal(got.activeForeground,'rgb(255, 255, 255)',
        where+': el botón activo debe conservar texto blanco');
      }
      if(width<=760)assert(got.headingMin>=44,where+': altura táctil insuficiente');
      else assert(got.headingMin<=43,where+': cabecera de preguntas demasiado alta');
      assert(got.headingFits,where+': título de pregunta recortado');
      assert(got.panelFit,where+': panel fuera de pantalla');
      assert.notEqual(got.foreground,got.background,where+': contraste de cabecera');
     }
     if(width<=900){
      await page.locator('#examQuestionsTab').click();
      assert(await page.locator('#examScoring').isVisible(),
       filename+'/'+width+': Puntuación debe seguir disponible en Preguntas móvil');
      assert(await page.locator('#examQuestionSettings').isVisible(),
       filename+'/'+width+': Preguntas debe seguir disponible en móvil');
      await page.locator('#examSettingsTab').click();
     }
    }
    await page.setViewportSize({width:1440,height:820});
    await page.locator('#examPanelShortcuts>button[data-target="exam-ui-core"]').click();
    await page.locator('#lang').selectOption('va');
    await page.waitForFunction(()=>document.querySelector('#examPanelShortcuts>[data-target="examQuestionSettings"]')?.textContent==='Preguntes');
    assert.equal(await page.locator('#examPanelShortcuts>[data-target="examVisualSettings"]').innerText(),
      'Format',filename+': falta traducción de acceso a formato');
    await page.locator('#examPanelShortcuts>button[data-target="examQuestionSettings"]').click();
    assert.equal(await page.locator('#exam-ui-shell-title').innerText(),'Preguntes',
     filename+': la cabecera activa no está traducida');
    await page.locator('#examPanelShortcuts>button[data-target="exam-ui-core"]').click();
    assert.equal(await page.locator('#exam-ui-shell-title').innerText(),'Preparar l’examen',
     filename+': la cabecera inicial no está traducida');
    assert.deepEqual(errors,[],filename+': errores JS');
   } finally {await page.close()}
  }
  console.log('Sidebar: 5 accesos seguros, 5 anchuras, 3 apariencias, valenciano, sin regeneración (web/autónoma)');
 } finally {await browser.close();await new Promise(ok=>server.close(ok))}
})().catch(err=>{console.error(err);process.exitCode=1});

'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const marker='<style id="examina-equal-toolbar-buttons">';
const source=['index.html','offline.html'].map(name=>fs.readFileSync(path.join(root,name),'utf8'));
function extract(html){
 assert.equal(html.split(marker).length,2,'Falta CSS único de igualdad de botones');
 const pos=html.indexOf(marker),end=html.indexOf('</style>',pos);
 assert(end>pos,'Sin cierre CSS');
 return html.slice(pos,end+8);
}
const styles=source.map(extract);
const compactMarker='<style id="examina-compact-main-navigation">';
function compactStyle(html){
 assert.equal(html.split(compactMarker).length,2,'Falta la navegación compacta');
 const start=html.indexOf(compactMarker),end=html.indexOf('</style>',start);
 assert(end>start,'Estilo compacto sin cierre');
 return html.slice(start,end+8);
}
const compactStyles=source.map(compactStyle);
assert.equal(compactStyles[0],compactStyles[1],'Navegación compacta distinta en web y autónoma');
assert(compactStyles[0].includes('@media screen {'),'La navegación compacta no debe afectar a impresión');
assert(compactStyles[0].includes('white-space:nowrap'),'Las pestañas deben conservar una sola línea');
assert.equal(styles[0],styles[1],'Tema distinto entre web y autónoma');
assert(styles[0].includes('@media screen {'),'No alterar impresión');
assert(!styles[0].includes('@media print'),'El papel no debe modificarse');
for(const selector of ['.vocab-tabbar > button','#examPreviewActions > button']){
 assert(styles[0].includes(selector),'Falta selector: '+selector);
}
const server=http.createServer((request,response)=>{
 const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname).replace(/^\/+/,'')||'index.html';
 const file=path.resolve(root,pathname);
 if(!file.startsWith(root+path.sep)){response.writeHead(403).end();return;}
 fs.readFile(file,(error,data)=>{
  if(error){response.writeHead(404).end();return;}
  response.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':
   file.endsWith('.js')?'text/javascript; charset=utf-8':
   file.endsWith('.json')?'application/json; charset=utf-8':'application/octet-stream');
  response.end(data);
 });
});
function same(numbers,why){
 assert(numbers.length>=2,why+': falta grupo de botones');
 assert(Math.max(...numbers)-Math.min(...numbers)<1.01,why+': tamaños distintos '+numbers.join(', '));
}
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({headless:true});
 try {
  for(const file of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1440,height:850}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try {
    await page.goto('http://127.0.0.1:'+server.address().port+'/'+file,{waitUntil:'load'});
    await page.waitForFunction(()=>!!document.getElementById('academicNav')&&!!document.getElementById('examPreviewActions'));
    for(const width of [1440,1024,820,390,320]){
     await page.setViewportSize({width,height:850});
     for(const appearance of ['light','dark','oled']){
      const result=await page.evaluate(appearance=>{
       document.documentElement.dataset.appearance=appearance;
       const info=selector=>{
        const parent=document.querySelector(selector);
        const children=Array.from(parent.querySelectorAll(':scope > button'));
        const bounds=parent.getBoundingClientRect();
        return {
         total:children.length,
         widths:children.map(el=>el.getBoundingClientRect().width),
         heights:children.map(el=>el.getBoundingClientRect().height),
         within:children.every(el=>{
          const r=el.getBoundingClientRect();
          return r.left>=bounds.left-1&&r.right<=bounds.right+1&&r.width>0&&r.height>0
           &&el.scrollHeight<=el.clientHeight+2;
         })
        };
       };
       const docx=getComputedStyle(document.getElementById('docx')).backgroundColor;
       const pdf=getComputedStyle(document.getElementById('pdfDownload')).backgroundColor;
       const buttons=Array.from(document.querySelectorAll('.vocab-tabbar > button'));
       const navOneLine=buttons.every(button=>{
        const css=getComputedStyle(button);
        return css.whiteSpace==='nowrap'&&button.getBoundingClientRect().height<=45
         &&button.scrollWidth<=button.clientWidth+2&&button.scrollHeight<=button.clientHeight+2;
       });
       const navSameRow=buttons.every(button=>
        Math.abs(button.getBoundingClientRect().top-buttons[0].getBoundingClientRect().top)<1);
       const selected=buttons.find(button=>button.classList.contains('active'));
       const navDistinct=!!selected&&buttons.some(button=>!button.classList.contains('active')&&
         getComputedStyle(button).backgroundColor!==getComputedStyle(selected).backgroundColor);
       return {nav:info('.vocab-tabbar'),toolbar:info('#examPreviewActions'),docx,pdf,navOneLine,navSameRow,navDistinct};
      },appearance);
      const where=file+'/'+width+'/'+appearance;
      assert.equal(result.nav.total,4,where+': deben existir cuatro pestañas');
      assert.equal(result.toolbar.total,5,where+': deben existir cinco acciones');
      same(result.nav.heights,where+' cabecera altura');
      same(result.toolbar.heights,where+' acciones altura');
      same(result.toolbar.widths,where+' acciones anchura');
      assert(result.nav.within,where+': algún botón de cabecera desborda o recorta su texto');
      assert(result.navOneLine,where+': una pestaña parte o recorta el texto');
      assert(result.navDistinct,where+': la pestaña activa no destaca');
      if(width===1440)assert(result.navSameRow,where+': cuatro pestañas deben compartir fila');
      assert(result.toolbar.within,where+': alguna acción desborda o recorta su texto');
      assert.equal(result.docx,'rgb(25, 89, 158)',where+': Word pierde su color');
      assert.equal(result.pdf,'rgb(163, 34, 43)',where+': PDF pierde su color');
     }
    }
    assert.deepEqual(errors,[],file+': errores de JavaScript');
   } finally {await page.close();}
  }
  console.log('Botones uniformes y sin desbordamientos: 5 anchuras, 3 apariencias, web y autónoma');
 } finally {await browser.close();await new Promise(ok=>server.close(ok));}
})().catch(error=>{console.error(error);process.exitCode=1});

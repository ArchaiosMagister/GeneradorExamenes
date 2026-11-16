'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const marker='<style id="vista-previa-examinator">';
const source=['index.html','offline.html'].map(path=>fs.readFileSync(path,'utf8'));
function findStyle(html){
 assert.equal(html.split(marker).length,2,'Falta o está duplicado el tema Examinator');
 const start=html.indexOf(marker),end=html.indexOf('</style>',start);
 assert(end>start,'Falta cerrar la hoja de estilos');
 return html.slice(start,end+8);
}
const styles=source.map(findStyle);
assert.equal(styles[0],styles[1],'El tema debe coincidir entre la PWA y la versión autónoma');
assert(styles[0].includes('@media screen {'),'El tema debe afectar solo a la pantalla');
assert(styles[0].includes('html:not([data-appearance="dark"]):not([data-appearance="oled"])'),'No sobrescribir colores OLED y oscuros');
for(const selector of ['#examPreviewActions','#docx','#pdfDownload','#paper','.vocab-tabbar','#examEditorPanel']){
 assert(styles[0].includes(selector),'Falta selector: '+selector);
}
for(const token of ['--accent:#1d5466','--soft:#204750','--soft-ink:#d8f5f3',
 '--appearance-accent:#96d5ce','--appearance-button:#234950']){
 assert(styles[0].includes(token),'Falta el verde azulado oscuro: '+token);
}
assert(styles[0].includes(':root[data-course]:is([data-appearance="dark"],[data-appearance="oled"])'),
 'No se respeta el tema por asignatura');
assert(!styles[0].includes('@media print'),'No alterar la maqueta impresa');
console.log('Tema Examinator sincronizado en HTML web/autónomo, impresión intacta');

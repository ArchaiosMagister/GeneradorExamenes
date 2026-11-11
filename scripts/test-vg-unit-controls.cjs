'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1150,height:880}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../offline.html')).href,{waitUntil:'load'});
  await page.click('#vgShow');
  await page.locator('#vgUnitButtons .vg-unit-button').first().waitFor();

  async function unitColors(){
   return page.evaluate(()=>{
    const container=document.querySelector('#vgUnitButtons');
    const buttons=[...container.querySelectorAll('.vg-unit-button')];
    const luminance=text=>{
     const rgb=text.match(/[\d.]+/g)?.slice(0,3).map(Number);
     if(!rgb||rgb.length!==3)throw Error('Color no RGB: '+text);
     return rgb.map(n=>{const x=n/255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4)})
      .reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
    };
    return buttons.map(button=>{
     const style=getComputedStyle(button),bg=style.backgroundColor,fg=style.color;
     const a=luminance(bg),b=luminance(fg);
     return {label:button.textContent.trim(),selected:button.getAttribute('aria-pressed')==='true',
      filled:button.dataset.filled==='true',bg,fg,ratio:Math.round((Math.max(a,b)+.05)/(Math.min(a,b)+.05)*100)/100};
    });
   });
  }
  async function assertColors(mode){
   await page.selectOption('#appearanceMode',mode);
   const colors=await unitColors();
   assert(colors.length>=3,'Necesitamos una unidad vacía, una llena y una seleccionada');
   assert(colors.every(x=>x.ratio>=4.5),
    'Contraste de texto insuficiente en '+mode+': '+JSON.stringify(colors));
   const active=colors.find(x=>x.selected),filled=colors.find(x=>x.filled&&!x.selected),
    empty=colors.find(x=>!x.filled&&!x.selected);
   assert(active&&filled&&empty,'No se distinguen los tres estados en '+mode);
   assert.notEqual(active.bg,filled.bg,'Seleccionada y con contenido tienen el mismo fondo');
   assert.notEqual(filled.bg,empty.bg,'Con contenido y sin texto tienen el mismo fondo');
   return colors;
  }

  await page.fill('#vgCount','4');
  await page.locator('#vgCount').dispatchEvent('change');
  assert.equal(await page.locator('#vgUnitButtons .vg-unit-button').count(),4);
  await page.fill('#vgTitle','Lección con nombre');
  await page.fill('#vgText','Puella cantat');
  await page.selectOption('#vgMode','simple');
  await page.locator('#vgUnitButtons .vg-unit-button').nth(1).click();
  await page.fill('#vgText','Rosa amat puellam');
  await page.locator('#vgUnitButtons .vg-unit-button').nth(2).click();
  await page.fill('#vgText','Servus currit');
  await page.locator('#vgUnitButtons .vg-unit-button').first().click();

  const colors={};
  for(const mode of ['light','dark','oled'])colors[mode]=await assertColors(mode);
  assert.deepEqual(errors,[],'Errores JS durante las comprobaciones de modo claro y oscuro');

  // Una cancelación no puede borrar contenido ni modificar el almacenamiento local.
  await page.selectOption('#appearanceMode','light');
  const previous=await page.evaluate(()=>localStorage.getItem('examina_vocabulary_project_v1'));
  assert(previous?.includes('Servus currit'));
  let cancelObserved=false;
  page.once('dialog',async dialog=>{
   cancelObserved=true;
   assert.match(dialog.message(),/todas las unidades, incluidas las ocultas/i);
   await dialog.dismiss();
  });
  await page.click('#vgClearAll');
  assert(cancelObserved,'Limpiar todo debe mostrar confirmación explícita');
  assert.equal(await page.locator('#vgUnitButtons .vg-unit-button').count(),4);
  assert.equal(await page.evaluate(()=>localStorage.getItem('examina_vocabulary_project_v1')),previous,
   'Cancelar no puede modificar el proyecto almacenado');

  // La reducción temporal de unidades deja datos ocultos. Limpiar todo debe
  // eliminarlos también; no basta con borrar las unidades visibles.
  await page.fill('#vgCount','2');
  await page.locator('#vgCount').dispatchEvent('change');
  const hidden=await page.evaluate(()=>{
   const project=JSON.parse(localStorage.getItem('examina_vocabulary_project_v1'));
   return {count:project.count,third:project.units[2]?.text};
  });
  assert.equal(hidden.count,2);
  assert.equal(hidden.third,'Servus currit');

  let accepted=false;
  page.once('dialog',async dialog=>{
   accepted=true;
   assert.match(dialog.message(),/No podrás deshacerlo sin una copia JSON/i);
   await dialog.accept();
  });
  await page.click('#vgClearAll');
  assert(accepted,'La confirmación debe preceder a todo borrado');
  assert.equal(await page.locator('#vgUnitButtons .vg-unit-button').count(),1);
  assert.equal(await page.inputValue('#vgCount'),'1');
  assert.equal(await page.inputValue('#vgTitle'),'UD1');
  assert.equal(await page.inputValue('#vgText'),'');
  assert.equal(await page.inputValue('#vgMode'),'complete');
  assert.equal(await page.locator('#vgResults').textContent(),'');
  const after=await page.evaluate(()=>{
   const p=JSON.parse(localStorage.getItem('examina_vocabulary_project_v1'));
   return {count:p.count,unitCount:p.units.length,unit:p.units[0],course:p.course,lang:p.lang};
  });
  assert.equal(after.count,1);
  assert.equal(after.unitCount,1,'Las unidades ocultas se deben eliminar, no solo esconder');
  assert.deepEqual({text:after.unit.text,title:after.unit.title,rows:after.unit.rows},
   {text:'',title:'UD1',rows:[]});
  assert.equal(after.course,'lat1');
  assert.equal(after.lang,'es');
  assert.match(await page.locator('#vgStatus').textContent(),/Proyecto limpiado/);

  // El restablecimiento se conserva tras recargar la webapp sin conexión.
  await page.reload({waitUntil:'load'});
  await page.click('#vgShow');
  assert.equal(await page.inputValue('#vgCount'),'1');
  assert.equal(await page.inputValue('#vgText'),'');
  assert.equal(await page.locator('#vgUnitButtons .vg-unit-button').count(),1);
  assert.deepEqual(errors,[],'Errores de navegador después de limpiar o recargar');

  console.log('OK: contrastes AA claro/oscuro/OLED; confirmación, cancelación, datos ocultos, borrado y persistencia');
  console.log('Ratios claro:',colors.light.map(x=>x.label+': '+x.ratio).join(', '));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});

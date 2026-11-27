const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const cell=(colSpan=1,tagName='TD')=>({colSpan,tagName,children:[],getAttribute:()=>String(colSpan)});
const row=(...cells)=>({cells,children:cells});
const examples=[
 [row(cell(2,'TH'),cell(2,'TH')),row(cell(1),cell(3))],
 [row(cell(3,'TH')),row(cell(3))],
 [row(cell(),cell(),cell()),row(cell(2),cell())],
 [row(cell(),cell()),row(cell(),cell())],
];
for(const filename of ['index.html','offline.html']){
 const html=fs.readFileSync(path.join(__dirname,'..',filename),'utf8');
 const start=html.indexOf('function wordTable(table){');
 const end=html.indexOf('// El glosario se exporta',start);
 assert(start>=0&&end>start);
 let specializedCalls=0;
 const ctx=vm.createContext({wordPara:()=>'<w:p/>',wordBlock:()=>'<w:p/>',wordExamTable:()=>{specializedCalls++;return 'specialized'}});
 const exportTable=vm.runInContext(html.slice(start,end)+';wordTable',ctx);
 for(const rows of examples){
  const table={rows,querySelectorAll:()=>rows,classList:{contains:()=>false}};
  const xml=exportTable(table);
  const expectedCols=Math.max(...rows.map(r=>r.cells.reduce((n,c)=>n+c.colSpan,0)));
  const grid=[...xml.matchAll(/<w:gridCol w:w="(\d+)"\/>/g)].map(m=>Number(m[1]));
  assert.equal(grid.length,expectedCols,filename+': número de columnas lógicas');
  assert.equal(grid.reduce((n,w)=>n+w,0),8788,filename+': anchura de cuadrícula');
  const exportedRows=[...xml.matchAll(/<w:tr>(.*?)<\/w:tr>/g)];
  assert.equal(exportedRows.length,rows.length);
  for(const [i,match] of exportedRows.entries()){
   const widths=[...match[1].matchAll(/<w:tcW w:w="(\d+)"/g)].map(m=>Number(m[1]));
   assert.equal(widths.length,rows[i].cells.length);
   assert.equal(widths.reduce((n,w)=>n+w,0),8788,filename+': anchura de fila');
   const spans=[...match[1].matchAll(/<w:gridSpan w:val="(\d+)"/g)].map(m=>Number(m[1]));
   assert.deepEqual(spans,rows[i].cells.map(c=>c.colSpan).filter(n=>n>1));
  }
  for(const edge of ['top','left','bottom','right','insideH','insideV'])assert(xml.includes('<w:'+edge+' w:val="single"'),filename+': borde '+edge);
 }
 assert.equal(exportTable({rows:[],classList:{contains:()=>false}}),'');
 assert.equal(exportTable({classList:{contains:k=>k==='exam-paradigm'}}),'specialized');
 assert.equal(specializedCalls,1);
 console.log(filename+': cuatro estructuras de tabla, ancho, cuadrícula, bordes y ruta especializada');
}

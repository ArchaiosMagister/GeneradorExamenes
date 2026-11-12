const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const file of ['offline-lemmas.js','vocabulary-generator.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const api=ctx.window.ExaminaVocabulary,data=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json')));
// Decisiones docentes aprobadas: una sola ficha en el índice, dos unidades
// que comparten adjetivo, y una sola oración de UD10 que debe corregirse.
const latinSource=fs.readFileSync(path.join(root,'index.html'),'utf8');
const newEntry='"entry": "tener, tenera, tenerum", "meaning": "pequeño/a"';
assert.equal(latinSource.split(newEntry).length-1,2,'Tener debe figurar en UD2 y UD3');
assert(!latinSource.includes('"entry": "tenerus, –a, –um"'));
assert.equal(data.vocabulary.lat.tener.lat1.entry,'tener, tenera, tenerum');
assert.equal(data.vocabulary.lat.tenerus,undefined);
const vocabSource=fs.readFileSync(path.join(root,'vocabulary-generator.js'),'utf8');
const migrationStart=vocabSource.indexOf('function applyLatinEditorialProjectCorrections(project){');
const migrationEnd=vocabSource.indexOf('function migrateProject(project){',migrationStart);
assert(migrationStart>0&&migrationEnd>migrationStart,'Falta migración de la UD10');
const correctText=new Function('project',vocabSource.slice(migrationStart,migrationEnd)+
 '\napplyLatinEditorialProjectCorrections(project);');
const oldText='Pecunia carere nonnulli philosophi placebat.';
const revisedText='Pecunia carere nonnullis philosophis placebat.';
const testProject={course:'lat1',units:[
 {title:'UD2',text:'Magister teneros pueros docebat.',rows:[]},
 {title:'UD10',text:'Puer amat. '+oldText+' Puella laborat.',rows:[]},
 {title:'UD11',text:oldText,rows:[]}
]};
correctText(testProject);
assert.equal(testProject.units[0].text,'Magister teneros pueros docebat.');
assert.equal(testProject.units[1].text,'Puer amat. '+revisedText+' Puella laborat.');
assert.equal(testProject.units[2].text,oldText,'No modificar oraciones de otras unidades');
correctText(testProject);
assert.equal(testProject.units[1].text,'Puer amat. '+revisedText+' Puella laborat.',
 'La migración es idempotente');
const greekProject={course:'gr1',units:[{title:'UD10',text:oldText,rows:[]}]};
correctText(greekProject);
assert.equal(greekProject.units[0].text,oldText,'No cambiar textos griegos');
const bank=[{entry:'amo, amavi, amatum (1ª)',meaning:'MI TRADUCCIÓN'}];
const rows=api.analyze(data,'Amo amo amamus xyzxyz','lat1',bank);
assert.equal(rows.length,3);assert.equal(rows.find(r=>r.form==='xyzxyz').status,'unknown');
assert.equal(rows.find(r=>r.form==='amamus').meaning,'MI TRADUCCIÓN');
assert.equal(api.entries(rows).length,2);
assert.equal(api.displayEntry(bank[0].entry,'simple'),'amo (1ª)');
assert.equal(api.displayEntry('amo','complete'),'amo');
assert.equal(api.displayEntry('λύω','simple'),'λύω');
const fixture={rows:{lat:[['amo','test','V',0],['bellum','test','N',2]]},vocabulary:{lat:data.vocabulary.lat}};
const ambiguous=api.analyze(fixture,'test','lat1',[])[0];assert.equal(ambiguous.status,'review');
const project={course:'lat1',lang:'es',count:2,units:[1,2].map(i=>({title:'UD'+i,mode:'complete',rows}))};
const xml=api.documentXml(project);
assert.equal((xml.match(/MI TRADUCCIÓN/g)||[]).length,2);
assert.equal((xml.match(/<w:sectPr>/g)||[]).length,1,'El documento utiliza una sola sección');
assert.equal((xml.match(/<w:cols w:num="1"/g)||[]).length,1,'Una sola columna');
assert.doesNotMatch(xml,/<w:cols w:num="2"/,'Sin columnas dobles');
assert.match(xml,/Vocabulario por unidades de Latín I/);
assert.match(xml,/<w:smallCaps\/><w:rFonts[^>]+><w:sz w:val="28"/);
assert.match(xml,/<w:top w:val="single" w:sz="4"/,'Borde del título de 0,5 pt');
assert.match(xml,/<w:i\/>[^]*amo, amavi, amatum/,'Enunciado latino en cursiva');
// El enunciado latino conserva la cursiva, pero cualquier paréntesis es redonda.
const formatProject={course:'lat1',lang:'es',count:1,units:[{
 title:'UD1',mode:'complete',rows:[
 {form:'ad',entry:'ad (prep. + ac.)',meaning:'a, hacia',status:'documented'},
 {form:'agricola',entry:'agricola, –æ (m.)',meaning:'campesino',status:'documented'},
 {form:'amo',entry:'amo, amavi, amatum (1ª)',meaning:'amar',status:'documented'},
 {form:'castra',entry:'castra, –orum (sólo pl.)',meaning:'campamento',status:'documented'},
 {form:'rex',entry:'rex, regis (m.)',meaning:'rey',status:'documented'},
 {form:'pendiente',entry:'pendiente (v.)',meaning:'',status:'review'}
]}]};
const wordFormat=api.documentXml(formatProject);
const runs=[...wordFormat.matchAll(/<w:r>(.*?)<\/w:r>/gs)].map(m=>({
 text:(m[1].match(/<w:t xml:space="preserve">([^<]*)<\/w:t>/)||[])[1]||'',
 italic:m[1].includes('<w:i/>')
}));
function runsWith(text){return runs.filter(r=>r.text.includes(text))}
for(const citation of ['ad ','agricola, –æ ','amo, amavi, amatum ','castra, –orum ','rex, regis '])
 assert.ok(runsWith(citation).some(r=>r.italic),'Falta cursiva en '+citation);
for(const note of ['(prep. + ac.)','(m.)','(1ª)','(sólo pl.)','(v.)'])
 assert.ok(runsWith(note).some(r=>!r.italic),'Debe ir en redonda '+note);
assert.ok(!runs.some(r=>/\([^)]*\)/.test(r.text)&&r.italic),'Algún paréntesis latino conserva cursiva');
const simpleProject={...formatProject,units:[{...formatProject.units[0],mode:'simple'}]};
const simpleRuns=[...api.documentXml(simpleProject).matchAll(/<w:r>(.*?)<\/w:r>/gs)]
 .map(m=>({text:(m[1].match(/<w:t xml:space="preserve">([^<]*)<\/w:t>/)||[])[1]||'',italic:m[1].includes('<w:i/>')}));
assert.ok(simpleRuns.some(r=>r.text==='amo '&&r.italic));
assert.ok(simpleRuns.some(r=>r.text==='(1ª)'&&!r.italic));

assert.match(xml,/<w:sectPr><w:pgSz[^]*<w:cols w:num="1"[^]*<\/w:body>/);
assert.match(xml,/<w:t xml:space="preserve">\* <\/w:t>/);assert.match(xml,/xyzxyz/);
const fromEulexis={course:'gr1',lang:'es',count:1,units:[{
 title:'UD1',mode:'complete',rows:[{
  form:'θεοῦ',lemma:'θεός',entry:'θεός, –οῦ (ὁ)',meaning:'dios',
  candidates:[],status:'manual',eulexisUnverified:true
 }]
}]};
// Formas aisladas de la regresión con Latín 4.º UD5 y Griego I UD6.
for(const course of ['lat1','lat4']){
 const rows=api.analyze(data,'Est. Ēst.',course,[],{contextual:true});
 assert.equal(rows[0].status,'review');
 assert.deepEqual(Array.from(rows[0].candidates,c=>c.lemma).sort(),['edo','sum']);
 assert.equal(rows[1].status,'documented');assert.equal(rows[1].lemma,'edo');
}
const crossCourseIndex={rows:{lat:[['scribo','scripsisset','V;SBJV;ACT;PST;3;SG',0]]},
 vocabulary:{lat:{scribo:{lat1:{entry:'scribo (3ª)'}}}}};
const crossCourseRows=api.analyze(crossCourseIndex,'scripsisset','lat4',
 [{entry:'scrībō (3ª)',meaning:'glosa del curso'}],{contextual:true});
assert.equal(crossCourseRows[0].status,'documented');
assert.equal(crossCourseRows[0].meaning,'glosa del curso');
const middle=api.analyze(data,'βάλλεται','gr1',[{entry:'βάλλω',meaning:'lanzar'}],{contextual:true});
assert.equal(middle[0].status,'documented');assert.equal(middle[0].meaning,'lanzar');
for(const [course,form,citations] of [
 ['lat1','est',['sum','edō']],['lat4','est',['sum','edō']],
 ['gr1','τι',['τις','τίς']]
]){
 const candidates=citations.map(lemma=>({lemma,entry:lemma,meaning:''}));
 const pending={form,entry:form,meaning:'',status:'review',candidates,context:form};
 const accepted={...pending,form:'aceptada',entry:'Confirmada',status:'manual',lemma:'confirmada'};
 const omitted={...pending,form:'omitida',entry:'Omitida',status:'omitted'};
 const units=[{title:'UD1',mode:'complete',rows:[pending,accepted,omitted]}];
 const base={course,count:1,units};
 const enabled=api.documentXml({...base,wordAlternatives:true});
 const paragraphs=enabled.split('</w:p>');
 for(const citation of citations)
  assert(paragraphs.some(p=>p.includes('* ')&&(p.includes(citation+'<')||p.includes(citation+' [')||p.includes(citation+':'))),course+' · '+citation);
 assert(paragraphs.some(p=>p.includes('Confirmada')&&!p.includes('* ')));
 assert.doesNotMatch(enabled,/Omitida/);
 assert(!api.documentXml(base).includes(citations[1]));
}
const latinExamBank=[{entry:'fōrtĭs, –e',meaning:'fuerte'},
 {entry:'terra, −æ',meaning:'glosa del banco de prueba'}];
const latinExamRows=api.analyze(data,'terra marique fortissime timebant fortitudinem','lat4',latinExamBank,{contextual:true});
for(const [form,lemma] of [['terra','terra'],['timebant','timeo'],['fortitudinem','fortitudo']])
 assert(latinExamRows.some(r=>r.form===form&&r.lemma===lemma&&r.status==='documented'));
assert.equal(latinExamRows.find(r=>r.form==='terra').meaning,'glosa del banco de prueba');
assert(latinExamRows.find(r=>r.form==='marique').encliticQue);
const adverb=latinExamRows.find(r=>r.form==='fortissime');
assert.equal(adverb.status,'review');
assert(adverb.candidates.some(c=>c.entry==='fortissime (adv.)'&&c.meaning==='con mucha fuerza'));
const greekExamRows=api.analyze(data,'σώζονται παιδεύεται ἀνθρώποι νὸμοι ἀδικόν οἰ διδασκὰλου',
 'gr1',[{entry:'σῴζω',meaning:'glosa griega de prueba'}],{contextual:true});
for(const form of ['σώζονται','παιδεύεται'])
 assert.equal(greekExamRows.find(r=>r.form===form).status,'documented');
assert.equal(greekExamRows[0].meaning,'glosa griega de prueba');
for(const row of greekExamRows.slice(2)){
 assert.equal(row.status,'review');
 assert.match(row.warning,/Posible errata/);
}
const greekDocx=api.documentXml(fromEulexis);
assert.doesNotMatch(greekDocx,/Pendientes de revisión|\* θεός/,
 'La decisión léxica docente pasa a Word sin asterisco');
assert.equal(fromEulexis.units[0].rows[0].eulexisUnverified,true,
 'La aceptación léxica conserva el origen morfológico sin certificar');

assert.throws(()=>api.documentXml({count:1,units:[{title:'UD1',text:'ὁ θεός',rows:[]}]}),/sin analizar/);
const greekRows=api.analyze(data,'λύω ἄγνωστον','gr1',[]);
assert.equal(greekRows.length,2);
assert.equal(greekRows[1].form,'ἄγνωστον','se deben conservar los diacríticos griegos originales');

const priorityBank=[
 {entry:'Ἀθηναῖος, –α, –ον',meaning:'ateniense'},
 {entry:'δοῦλος, –ου',meaning:'esclavo'},
 {entry:'θέος, –ου',meaning:'dios'},
 {entry:'γράφω',meaning:'escribir'},
 {entry:'εἰμί',meaning:'ser, estar, haber'},
 {entry:'οὐ, οὐκ, οὐχ (adv.)',meaning:'no'}
];
const priority=api.analyze(data,'Ἀθηναῖοι Ἀθηναίων οἱ δοῦλοι γράφει εἰσιν θεοὶ οὐκ','gr1',priorityBank);
for(const token of ['Ἀθηναῖοι','Ἀθηναίων','οἱ','δοῦλοι','γράφει','εἰσιν','θεοὶ','οὐκ']){
 const found=priority.find(r=>r.form===token);
 assert.ok(found,'Falta la palabra prioritaria '+token);
 assert.equal(found.status,'documented','No lematizada: '+token+' -> '+JSON.stringify(found.candidates));
 assert.ok(found.meaning,'Falta la traducción: '+token);
}
assert.equal(priority.find(r=>r.form==='Ἀθηναῖοι').entry,'Ἀθηναῖος, –α, –ον');
assert.equal(priority.find(r=>r.form==='Ἀθηναῖοι').meaning,'ateniense');
const frequentGreek=api.analyze(data,'ἡ ἐν εἰς μὲν πολλοὺς οὗτοι μαθήτας ἀλλὰ','gr1',priorityBank);
for(const token of ['ἡ','ἐν','εἰς','μὲν','πολλοὺς','οὗτοι','ἀλλὰ']){
 const found=frequentGreek.find(r=>r.form===token);
 assert.equal(found?.status,'documented','La forma frecuente debería quedar reconocida: '+token);
 assert.ok(found.meaning,'Falta traducción de '+token);
}


const contrast=api.analyze(data,'τίς τις ὁ ὅ οἱ οἵ ἀλλὰ ἄλλα','gr1',priorityBank);
for(const token of ['τίς','τις','ὁ','ὅ','οἱ','οἵ','ἀλλὰ','ἄλλα'])
 assert.ok(contrast.some(r=>r.form===token),'No conservar homógrafo griego: '+token);
assert.equal(contrast.find(r=>r.form==='τίς')?.status,'documented');
assert.equal(contrast.find(r=>r.form==='τις')?.status,'documented');
assert.equal(contrast.find(r=>r.form==='ὁ')?.status,'documented');
assert.equal(contrast.find(r=>r.form==='ὅ')?.status,'documented');

// El interrogativo mantiene siempre el agudo en la primera sílaba.
 // El indefinido enclítico admite ausencia de acento y acento final,
 // incluso grave ante la palabra siguiente (Smyth §334).
const indefiniteVariants=['τὶ','τινας','τινι','τινος','τισὶ',
 'τινά','τινὰ','τινάς','τινὰς','τινός','τινὸς','τινί','τινὶ',
 'τινές','τινὲς','τινῶν','τινων','τισί','τισίν','τισὶν','τισιν'];
const interrogativeVariants=['τί','τίνα','τίνας','τίνος','τίνι','τίνες','τίνων','τίσι','τίσιν'];
for(const form of indefiniteVariants){
 const found=api.analyze(data,form,'gr1',priorityBank)[0];
 assert.equal(found?.status,'documented','Indefinido no reconocido: '+form+' '+JSON.stringify(found?.candidates));
 assert.equal(found.entry,'τις, τι (pron. indef.)','Confusión con el interrogativo: '+form);
}
for(const form of interrogativeVariants){
 const found=api.analyze(data,form,'gr1',priorityBank)[0];
 assert.equal(found?.status,'documented','Interrogativo no reconocido: '+form);
 assert.equal(found.entry,'τίς, τί (pron. interr.)','Confusión con el indefinido: '+form);
}
const apart=api.analyze(data,'τὶ τί τινας τίνας τινος τίνος τισὶ τίσι','gr1',priorityBank);
assert.equal(apart.length,8,'El tokenizador no debe fundir grafías diferentes');
assert.notEqual(apart.find(r=>r.form==='τὶ').entry,apart.find(r=>r.form==='τί').entry);
assert.notEqual(apart.find(r=>r.form==='τινος').entry,apart.find(r=>r.form==='τίνος').entry);
// Otros pares sensibles al acento no deben sufrir regresiones.
const otherAccents=api.analyze(data,'οἱ οἵ ἡ ἥ ἀλλὰ ἄλλα','gr1',priorityBank);
assert.equal(otherAccents.find(r=>r.form==='οἱ')?.status,'documented');
assert.equal(otherAccents.find(r=>r.form==='ἡ')?.status,'documented');

const demosthenesTypo=api.analyze(data,'Δημοσθήνης','gr1',priorityBank)[0];
assert.equal(demosthenesTypo.status,'review','El nombre propio con acento incorrecto debe revisarse');
assert.match(demosthenesTypo.warning,/Δημοσθένης/,'Debe mostrarse la forma correcta sin modificar los textos');
// Four individually checked forms recovered from corrected unit texts.
 // This changes runtime recognition only, not the verified morphology index.
const revisedUnitForms=api.analyze(data,'εἶχεν ἔφυγεν σωτηρίας ἑώρα','gr1',priorityBank);
for(const [form,head] of [['εἶχεν','ἔχω'],['ἔφυγεν','φεύγω'],
 ['σωτηρίας','σωτηρία'],['ἑώρα','ὁράω']]){
 const row=revisedUnitForms.find(x=>x.form===form);
 assert.equal(row?.status,'documented','Forma correcta no reconocida: '+form);
 assert.ok(row.entry,'Falta enunciado para '+form);
 assert.equal(ctx.window.ExaminaOfflineLemmatizer.normalize(row.lemma),
  ctx.window.ExaminaOfflineLemmatizer.normalize(head),
  'Lema inesperado para '+form);
}
assert.equal(data.extensions.greek_editorial_decisions.verifiedFormsAdded,0,
 'La mejora del generador no certifica paradigmas en el índice persistente');

const misspelled=api.analyze(data,'ἄνρωπος','gr1',priorityBank);
assert.equal(misspelled[0].status,'review','La errata debe quedar señalada, no aceptada');
assert.match(misspelled[0].warning,/ἄνθρωπος/);
for(const typo of ['στρατεγός','Περίκλους','σωτερίας','Aἰσχύλος']){
 const row=api.analyze(data,typo,'gr1',priorityBank)[0];
 assert.equal(row.status,'review','No aceptar automáticamente la errata: '+typo);
 assert.match(row.warning,/Posible errata/,'Falta sugerencia para '+typo);
}

const newVerbs=api.analyze(data,'ἐπαίδευσαν ἔπλευσαν ἐπεπυρεύκεσαν ἅπερ','gr1',priorityBank);
for(const form of ['ἐπαίδευσαν','ἔπλευσαν','ἐπεπυρεύκεσαν','ἅπερ'])
 assert.equal(newVerbs.find(r=>r.form===form)?.status,'documented','Forma griega contrastada '+form);

assert.notEqual(misspelled[0].status,'documented','No corregir silenciosamente errores ortográficos');
console.log('Griego prioritario: ateniense, nominales, presente, artículo y formas de εἰμί reconocidos.');

// La desambiguación griega se basa en la grafía y el acento exactos.
const accentRows=api.analyze(data,'ἤ ἡ ὤν ὧν οὐ οὗ ἦν ἥν τινα τινες μάχῃ ψυχὴν','gr1',priorityBank);
const exact=(w)=>accentRows.find(r=>r.form===w);
for(const w of ['ἤ','ἡ','ὤν','οὐ','οὗ','ἦν','ἥν','τινα','τινες','μάχῃ','ψυχὴν']){
 assert.equal(exact(w)?.status,'documented','No resuelta la grafía exacta '+w+': '+JSON.stringify(exact(w)?.candidates));
}
assert.notEqual(exact('ἤ')?.entry,exact('ἡ')?.entry);
assert.ok(exact('ἤ')?.meaning,'Debe conservar la traducción de ἤ del banco docente');
for(const typo of ['εἴς','θάλάττῃ','στρατεγός','ἄνρωπος']){
 const row=api.analyze(data,typo,'gr1',priorityBank)[0];
 assert.equal(row.status,'review','Una grafía anómala no debe aceptarse en silencio: '+typo);
 assert.match(row.warning,/Posible errata/);
}

const originalHTML=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bankStart=originalHTML.indexOf('let vocab=')+10;
const sourceBank=JSON.parse(originalHTML.slice(bankStart,originalHTML.indexOf(';',bankStart)));
for(const m of originalHTML.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))sourceBank.push(...JSON.parse(m[1]));
const GreekBank=sourceBank.filter(x=>x.course==='greek1');

// La cobertura extra de Latín I usa paradigmas escolares pero no modifica
// registros source=0/1/5 ni resuelve arbitrariamente lemas homógrafos.
const LatinBank=sourceBank.filter(x=>!x.course||x.course==='latin1');
// El perfecto de vinco es una forma contrastada, no una propuesta de modelo.
const latinVictory=api.analyze(data,'vicerunt','lat1',LatinBank)[0];
assert.equal(latinVictory.status,'documented','vicerunt no se ha reconocido automáticamente');
assert.equal(latinVictory.lemma,'vinco');
assert.match(latinVictory.entry,/vinco, vici, victum/);
const Latin4Bank=sourceBank.filter(row=>row.course==='latin4');
const latin4Victory=api.analyze(data,'vicerunt','lat4',Latin4Bank)[0];
assert.equal(latin4Victory.status,'documented','vicerunt debe reconocerse también con el enunciado breve de 4.º');
assert.equal(latin4Victory.lemma,'vinco');
assert.equal(data.rows.lat.filter(row=>row[0]==='vinco'&&row[2]==='V;IND;ACT;PRF;3;PL'&&row[3]===5).length,1);
const latinCorpusGuards=api.analyze(data,
 'alta humanum tuæ mihi me esse potest dare docebat longisque fecerant Romamque',
 'lat1',LatinBank);
for(const form of ['alta','humanum','tuæ','mihi','me','esse','potest',
 'dare','docebat','longisque','fecerant','Romamque']){
 const item=latinCorpusGuards.find(x=>x.form===form);
 assert.equal(item?.status,'documented','Forma escolar habitual no reconocida: '+form);
}
const realHomographs=api.analyze(data,'bona bello','lat1',LatinBank);
for(const form of ['bona','bello']){
 assert.equal(realHomographs.find(x=>x.form===form)?.status,'review',
  'No elegir arbitrariamente entre lemas homógrafos: '+form);
}
const servaCandidate=api.analyze(data,'servæ','lat1',LatinBank)[0];
assert.equal(servaCandidate?.status,'documented',
 'servæ debe ser flexión nominal de serva, –æ, no del sustantivo servus, –i');
assert.equal(ctx.window.ExaminaOfflineLemmatizer.normalize(servaCandidate.lemma),'serva');
assert.equal(api.analyze(data,'servus','lat1',LatinBank)[0]?.status,'documented');
const historicOrthography=api.analyze(data,'uideo video','lat1',LatinBank);
assert.equal(historicOrthography.length,1,'La búsqueda latina debe tratar u/v como alógrafos');
assert.equal(historicOrthography[0].status,'documented');

// -que copulativa vs. -que inseparable en palabras y pronombres.
const queBank=[
 {entry:'longus, –a, –um',meaning:'largo/a'},
 {entry:'Roma, –æ',meaning:'Roma'},
 {entry:'quis, quid (pron. interr.)',meaning:'quién'},
 {entry:'uter, utra, utrum (pron. interr.)',meaning:'cuál de dos'}
];
const queWords='quoque neque atque itaque denique namque utique ubique undique usque '+
 'quisque cuiusque cuique quemque uterque utriusque utraque utrumque '+
 'quicumque cuiuscumque ubicumque longisque Romamque';
const queRows=api.analyze(data,queWords,'lat1',queBank);
const findQue=form=>queRows.find(row=>row.form===form);
for(const [form,expected] of [
 ['quoque','quoque'],['neque','neque'],['atque','atque'],
 ['itaque','itaque'],['denique','denique'],['namque','namque'],
 ['utique','utique'],['ubique','ubique'],['undique','undique'],
 ['usque','usque'],['quisque','quisque'],['cuiusque','quisque'],
 ['cuique','quisque'],['quemque','quisque'],
 ['uterque','uterque'],['utriusque','uterque'],['utraque','uterque'],
 ['utrumque','uterque'],['quicumque','quicumque'],
 ['cuiuscumque','quicumque'],['ubicumque','ubicumque']]){
 const found=findQue(form);
 assert.equal(found?.status,'documented','El compuesto indivisible requiere lema: '+form);
 assert.equal(ctx.window.ExaminaOfflineLemmatizer.normalize(found.lemma),
   ctx.window.ExaminaOfflineLemmatizer.normalize(expected),
   'No separar el final -que en '+form);
}
for(const [form,expected] of [['longisque','longus'],['Romamque','roma']]){
 const found=findQue(form);
 assert.equal(found?.status,'documented','La verdadera enclítica debe reconocerse: '+form);
 assert.equal(ctx.window.ExaminaOfflineLemmatizer.normalize(found.lemma),
  expected,'La base de '+form+' debe ser '+expected);
}
const withTrueNexus=api.entries(api.analyze(data,
 'longisque Romamque bonaque','lat1',queBank));
assert.equal(withTrueNexus.filter(x=>x.entry==='–que (conj.)').length,1,
 'La enclítica genuina se debe mostrar como un solo lema conjunto');
assert.equal(withTrueNexus.find(x=>x.entry==='–que (conj.)').meaning,'y');
const withoutNexus=api.entries(api.analyze(data,
 'quoque neque atque quisque uterque quicumque','lat1',queBank));
assert.equal(withoutNexus.some(x=>x.entry==='–que (conj.)'),false,
 'Las terminaciones lexicalizadas no son un nexo coordinante');
const nexusXml=api.documentXml({course:'lat1',lang:'es',count:1,units:[{
 title:'UD1',mode:'complete',rows:api.analyze(data,'longisque quoque','lat1',queBank)
}]});
assert.match(nexusXml,/–que/,'El nexo debe aparecer en el Word de vocabulario');
assert.match(nexusXml,/<w:t xml:space="preserve">\(conj\.\)<\/w:t>/,
 'La categoría del nexo en Word debe quedar en redonda');
for(const form of ['longueque','uterquex','aliquiqueque']){
 assert.equal(api.analyze(data,form,'lat1',queBank)[0]?.status,'unknown',
  'No inventar la separación ni flexiones en '+form);
}

const priorityFixture=JSON.parse(fs.readFileSync(path.join(root,'tests/greek-priority-forms.json'),'utf8'));
assert.equal(priorityFixture.units.length,14);
const originals=[...new Set(priorityFixture.units.flatMap(u=>u.forms))];
const benchmark=api.analyze(data,originals.join('\n'),'gr1',GreekBank);
const success=benchmark.filter(r=>r.status==='documented');
const review=benchmark.filter(r=>r.status==='review');
const unknown=benchmark.filter(r=>r.status==='unknown');
const remainingEditorialForms=[
 'εἴς','στρατεγός','στρατεγὸς','θάλάττῃ','oἱ','ἄνρωπος',
 'εἷχεν','ἐφεύξεν','οἰκῦσιν','Περίκλους','στρατεγοὶ',
 'σωτερίας','ὠρᾶ','Aἰσχύλος'
];
assert.equal(benchmark.find(r=>r.form==='ὅδε')?.status,'documented',
 'El demostrativo ὅδε debe tener un único lema');
assert.ok(review.length<=40,
 'El índice Eulexis debe resolver la mayoría de formas sin ocultar homografías: '+
 JSON.stringify(review.map(r=>({form:r.form,candidates:r.candidates.map(c=>c.entry)}))));
for(const row of review){
 if(remainingEditorialForms.includes(row.form)||row.warning){
  assert.match(row.warning,/Posible errata/,
   'La errata original sigue requiriendo revisión: '+row.form);
 }else{
  assert.ok(new Set(row.candidates.map(c=>c.lemma)).size>1,
   'Una lectura no errónea no debería quedar en revisión sin al menos dos lemas: '+row.form);
 }
}

assert.ok(success.some(r=>r.meaning==='ateniense'), 'Debe identificar ateniense usando el banco propio');
assert.ok(success.length>100,'El corpus prioritario sigue sin cobertura nominal básica');
// El corpus original de 14 unidades se conserva sin reescribir:
 // las grafías descartadas en la revisión filológica no pueden rehabilitarse
 // como «documentadas» únicamente para conseguir un test verde.
const knownSuperseded=new Set(['Δημοσθήνης','θέᾳ']);
assert.ok(unknown.every(x=>knownSuperseded.has(x.form)),
 'Hay formas nuevas sin lematizar fuera de las grafías ya descartadas: '+
 JSON.stringify(unknown.map(x=>x.form)));
console.log('Formas del corpus antiguo aún pendientes de corrección textual:',
 JSON.stringify(unknown.map(x=>x.form)));
console.log('Corpus docente Griego I / pendientes anteriores:',JSON.stringify({
 total:originals.length,formasDistintasNormalizadas:benchmark.length,
 reconocidas:success.length,revision:review.length,desconocidas:unknown.length
}));
const normGreek=s=>s.toLowerCase().normalize('NFD').replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/ς/g,'σ');
const occ=new Map();
for(const u of priorityFixture.units)for(const form of u.forms){
 const k=normGreek(form);occ.set(k,(occ.get(k)||0)+1);
}
const topPending=rows=>rows.map(r=>({form:r.form,frecuencia:occ.get(normGreek(r.form))||0}))
 .sort((a,b)=>b.frecuencia-a.frecuencia||a.form.localeCompare(b.form,'el')).slice(0,280);
console.log('Pendientes restantes prioritarios sin índice:',JSON.stringify(topPending(unknown)));
console.log('Pendientes con lecturas alternativas:',JSON.stringify(topPending(review)));


console.log('Vocabulario: prioridad docente, deduplicación por UD, ambigüedad, desconocidas, griego y XML de una columna correctos.');
(async()=>{
 const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try{
 const page=await browser.newPage({acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+root+'/offline.html');await page.click('#vgShow');
 await page.click('#vgQualityPanel summary');
 await page.click('#vgQualityRefresh');
 await page.waitForFunction(()=>document.getElementById('vgQualityTotals').textContent.includes('Fichas:'));
 assert.ok(await page.locator('#vgQualityRows tr').count()>4,'Deben presentarse varias unidades');
 assert.match(await page.locator('#vgQualityQueueSummary').innerText(),/fichas requieren contraste/);
 const qualityDownload=page.waitForEvent('download');await page.click('#vgQualityExport');
 const qualityFile=await qualityDownload;
 const qualityJSON=JSON.parse(fs.readFileSync(await qualityFile.path(),'utf8'));
 assert.equal(qualityJSON.course,'lat1');
 assert.equal(qualityJSON.totals.rows,1107);
 console.log('Panel de cobertura por UD, filtro de pendientes y exportación JSON operativos.');
 const analyzeAll=page.locator('#vgAnalyzeAll');
 assert.equal(await analyzeAll.innerText(),'Analizar y revisar vocabulario');
 assert.equal(await page.locator('#vgAnalyze').count(),0);
 assert.equal(await analyzeAll.evaluate(el=>getComputedStyle(el).fontWeight),'800');

 // Prueba real de interfaz: diez frases escolares, incluida la preposición «ab».
 const latinCorpus=JSON.parse(fs.readFileSync(path.join(root,'tests/latin-vocabulary-sentences.json'),'utf8')).sentences;
 await page.fill('#vgText',latinCorpus.join('\n'));
 await page.click('#vgAnalyzeAll');
 await page.waitForFunction(()=>document.querySelector('#vgStatus')?.textContent.includes('pendientes'));
 await page.locator('#vgResults summary').filter({hasText:'Formas resueltas'}).click();
 const vocabularyPreview=await page.locator('#vgResults').innerText();
 assert.match(vocabularyPreview,/ab · Identificación automática/,'La UI debe reconocer ab sin revisión');
 assert.match(vocabularyPreview,/puella/i,'La UI debe identificar los lemas del texto');
 const sampleDownload=page.waitForEvent('download');await page.click('#vgWord');
 const sample=await sampleDownload;const samplePath=await sample.path();
 fs.mkdirSync(path.join(root,'test-artifacts'),{recursive:true});
 fs.copyFileSync(samplePath,path.join(root,'test-artifacts/vocabulario-latin-10-frases.docx'));
 console.log('Word real de diez frases guardado para revisión visual.');
 await page.fill('#vgText','');
 await page.fill('#vgCount','2');await page.locator('#vgCount').dispatchEvent('change');
 await page.fill('#vgText','Puella puella amamus xyzxyz');await page.click('#vgAnalyzeAll');await page.waitForFunction(()=>document.querySelector('#vgStatus').textContent.includes('pendientes'));
 assert.match(await page.locator('#vgResults').innerText(),/xyzxyz/);
 await page.selectOption('#vgMode','simple');await page.locator('#vgUnitButtons .vg-unit-button').nth(1).click();assert.equal(await page.inputValue('#vgText'),'');
 await page.fill('#vgText','Puella');await page.click('#vgAnalyzeAll');await page.waitForFunction(()=>document.querySelector('#vgStatus').textContent.includes('pendientes'));
 await page.locator('#vgUnitButtons .vg-unit-button').first().click();assert.match(await page.inputValue('#vgText'),/amamus/);
 const downloadPromise=page.waitForEvent('download');await page.click('#vgWord');const dl=await downloadPromise;const file=await dl.path();assert.equal(fs.readFileSync(file).readUInt32LE(0),0x04034b50);
 await page.reload();await page.click('#vgShow');assert.equal(await page.inputValue('#vgCount'),'2');
 assert.equal(await page.locator('#vgUnitButtons .vg-unit-button').count(),2,'Unidades en botones');
 const units=await page.locator('#vgUnitButtons .vg-unit-button').evaluateAll(nodes=>
  nodes.map(el=>({filled:el.dataset.filled,selected:el.getAttribute('aria-pressed')})));
 assert.deepEqual(units.map(x=>x.filled),['true','true'],'Los dos textos escritos se reflejan con marca de contenido');
 assert.equal(units.filter(x=>x.selected==='true').length,1,'Solo una unidad seleccionada');
 await page.locator('#vgUnitButtons .vg-unit-button').first().click();
 assert.equal(await page.locator('#vgUnitButtons .vg-unit-button').first().getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('#vgUnitButtons .vg-unit-button').nth(1).getAttribute('aria-pressed'),'false');
 // Reproduce un JSON antiguo de 14 unidades: textos, pero sin ningún análisis.
 const imported={count:14,course:'gr1',units:Array.from({length:14},(_,i)=>({
  title:'UD'+(i+1),text:'ὁ θεός ἐστιν. οἱ ἄνθρωποι.',mode:'complete',rows:[]
 }))};
 await page.locator('#vgImport').setInputFiles({
  name:'vocabulario-unidades.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))
 });
 await page.waitForFunction(()=>document.querySelector('#vgStatus')?.textContent.includes('14 por analizar'));
 assert.match(await page.locator('#vgStatus').innerText(),/14 por analizar/);
 const download14=page.waitForEvent('download');
 await page.click('#vgWord');const doc14=await download14;
 const body14=fs.readFileSync(await doc14.path()).toString('utf8');
 for(let n=1;n<=14;n++)assert.ok(body14.includes('UD'+n),'No existe contenido para UD'+n);
 assert.match(body14,/θεός|θεὸς|θεὸς|θέος/);
 assert.match(await page.locator('#vgStatus').innerText(),/Word generado con 14 unidades/);
 const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('examina_vocabulary_project_v1')));
 assert.equal(persisted.units.length,14);
 assert.ok(persisted.units.every(u=>u.text.includes('θεός')&&u.rows.length>0));
 console.log('Importación JSON con 14 unidades sin analizar: Word completo y textos conservados.');
 
 // Cada decisión se guarda por curso, unidad, forma y contexto.
 for(const [course,text,word,basic,lemma] of [
  ['lat1','Bona manent. Bona puella. Esse dare potest. Servae adsunt. xyzomit. xyzpending.','Bona','potest','possum'],
  ['lat4','Bona manent. Bona puella. Esse dare potest. Servae adsunt. xyzomit. xyzpending.','Bona','esse','sum'],
  ['gr1','ξψζ ἐστίν. ξψζ εἶναι. ψξζ. ζψξ.','ξψζ','εἶναι','ειμι']
 ]){
  await page.selectOption('#vgCourse',course);
  await page.fill('#vgCount','2');await page.locator('#vgCount').dispatchEvent('change');
  await page.locator('#vgUnitButtons button').first().click();
  await page.fill('#vgText',text);
  await page.locator('#vgUnitButtons button').nth(1).click();
  await page.fill('#vgText',course==='gr1'?'ὁ θεός':'Puella amat');
  await page.locator('#vgUnitButtons button').first().click();
  await page.click('#vgAnalyzeAll');
  const card=form=>page.locator('#vgResults section').filter({has:page.getByRole('heading',{name:form,exact:true})});
  const ambiguity=card(word);
  await ambiguity.first().waitFor();
  assert.equal(await ambiguity.count(),2,'La misma forma debe tener dos contextos');
  assert.equal(await ambiguity.first().locator('mark').textContent(),word);
  if(course!=='gr1'){
   const readings=await ambiguity.first().locator('option').allTextContents();
   assert(readings.some(x=>/b[oŏ]nus/u.test(x))&&readings.some(x=>x.startsWith('bona, ')));
  }
  await ambiguity.first().getByRole('button',{name:'Editar',exact:true}).click();
  await ambiguity.first().getByLabel('Enunciado',{exact:true}).fill('Cita docente '+course);
  await ambiguity.first().getByLabel('Traducción',{exact:true}).fill('Glosa docente');
  await ambiguity.first().getByRole('button',{name:'Guardar corrección'}).click();
  await card(course==='gr1'?'ψξζ':'xyzomit').getByRole('button',{name:'Omitir',exact:true}).click();
  await page.fill('#vgText',text+(course==='gr1'?' καί.':' et.'));
  await page.click('#vgAnalyzeAll');
  await page.waitForFunction(()=>document.querySelector('#vgStatus').textContent.startsWith('1 unidades actualizadas'));
  await page.click('#vgAnalyzeAll');
  await page.waitForFunction(()=>document.querySelector('#vgStatus').textContent.startsWith('0 unidades actualizadas'));
  const readProject=()=>page.evaluate(()=>JSON.parse(localStorage.examina_vocabulary_project_v1));
  const after=await readProject(),rows=after.units[0].rows;
  assert.equal(rows.filter(r=>r.form===word&&r.status==='manual').length,1);
  assert.equal(rows.filter(r=>r.form===word&&['unknown','review'].includes(r.status)).length,1);
  assert(rows.some(r=>r.form.toLowerCase()===basic&&r.status==='documented'&&r.lemma===lemma));
  if(course!=='gr1')assert(rows.some(r=>r.form==='Servae'&&['serva','serua'].includes(r.lemma)&&r.status==='documented'));
  await page.reload();await page.click('#vgShow');
  const backup=page.waitForEvent('download');await page.click('#vgBackup');
  const copy=await backup;
  await page.locator('#vgImport').setInputFiles(await copy.path());
  await page.waitForFunction(()=>document.querySelector('#vgStatus').textContent.includes('Proyecto importado'));
  assert.deepEqual((await readProject()).units[0].decisions[course],after.units[0].decisions[course]);
  const exported=page.waitForEvent('download');await page.click('#vgWord');
  const doc=fs.readFileSync(await (await exported).path(),'utf8');
  assert.match(doc,/Glosa docente/);assert.match(doc,/Pendientes de revisión \(\*\)/);
  assert.doesNotMatch(doc,course==='gr1'?/ψξζ/:/xyzomit/);
  await page.locator('#vgResults summary').filter({hasText:'Formas resueltas'}).click();
  await page.locator('#vgResults summary').filter({hasText:'Cita docente '+course}).click();
  await page.getByRole('button',{name:'Restablecer análisis',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#vgStatus').textContent.startsWith('1 unidades actualizadas'));
  assert.equal((await readProject()).units[0].decisions[course].length,1);
 }
 // Una forma de cita explícita sin análisis morfológico queda como propuesta de lote.
 await page.evaluate(()=>vocab.push({course:'greek1',entry:'ξψβ',meaning:'',unit:'UD1'}));
 await page.fill('#vgText','ξψβ.');
 await page.click('#vgAnalyzeAll');
 await page.locator('#vgResults summary').filter({hasText:'Propuestas seguras'}).click();
 await page.getByRole('button',{name:'Aceptar propuestas seleccionadas'}).click();
 const batch=await page.evaluate(()=>JSON.parse(localStorage.examina_vocabulary_project_v1).units[0].rows[0]);
 assert.equal(batch.status,'manual');assert.equal(batch.candidates[0].attested,false);
 assert.equal(batch.meaning,'');
 console.log('Tres cursos: contexto, cambios incrementales, corrección, omisión, Word, lote y copia JSON.');

 // La opción es de proyecto y se aplica a la descarga real sin cambiar las lecturas.
 await page.selectOption('#vgCourse','lat1');
 await page.fill('#vgText','Est bonus.');
 const alternatives=page.locator('#vgWordAlternatives');
 assert.equal(await alternatives.isChecked(),false);
 await alternatives.check();
 const downloadAlternatives=page.waitForEvent('download');await page.click('#vgWord');
 const altWord=fs.readFileSync(await (await downloadAlternatives).path(),'utf8');
 assert.match(altWord,/Pendientes de revisión/);
 assert.match(altWord,/edō/);assert.match(altWord,/sum/);
 await page.reload();await page.click('#vgShow');
 assert.equal(await alternatives.isChecked(),true);
 const altCopy=page.waitForEvent('download');await page.click('#vgBackup');
 const altFile=await (await altCopy).path();
 await alternatives.uncheck();
 await page.locator('#vgImport').setInputFiles(altFile);
 await page.waitForFunction(()=>document.querySelector('#vgStatus').textContent.includes('Proyecto importado'));
 assert.equal(await alternatives.isChecked(),true);
 await alternatives.uncheck();

 // Compartir una lectura es explícito cuando el pasaje cambia.
 await page.selectOption('#vgCourse','lat4');
 await page.fill('#vgText','Est bonus. Est panem. Est puella.');
 await page.click('#vgAnalyzeAll');
 const est=page.locator('#vgResults section').filter({has:page.getByRole('heading',{name:'Est',exact:true})});
 await est.first().waitFor();
 assert.equal(await est.count(),3);
 const firstEst=est.first(),sumChoice=firstEst.locator('option').filter({hasText:/^s[uŭ]m/u});
 await firstEst.locator('select').selectOption(await sumChoice.getAttribute('value'));
 const peers=firstEst.locator('details').filter({hasText:'Aplicar también'});
 assert.equal(await peers.locator('input:checked').count(),0);
 await peers.getByLabel(/Est puella/).check();
 await firstEst.getByRole('button',{name:'Aceptar',exact:true}).click();
 assert.match(await page.locator('#vgStatus').textContent(),/2 apariciones aceptadas/);
 const shared=await page.evaluate(()=>JSON.parse(localStorage.examina_vocabulary_project_v1).units[0].rows.filter(r=>r.form==='Est'));
 assert.deepEqual(shared.map(r=>r.status),['manual','review','manual']);

 if(process.env.LATIN1_VOCABULARY_CORPUS){
  const corpus=JSON.parse(fs.readFileSync(process.env.LATIN1_VOCABULARY_CORPUS,'utf8'));
  assert.equal(corpus.course,'lat1');assert.equal(corpus.count,10);
  await page.locator('#vgImport').setInputFiles(process.env.LATIN1_VOCABULARY_CORPUS);
  await page.waitForFunction(()=>document.querySelector('#vgStatus').textContent.includes('10 por analizar'));
  await page.click('#vgAnalyzeAll');
  await page.waitForFunction(()=>document.querySelector('#vgStatus').textContent.startsWith('10 unidades actualizadas'));
  const current=await page.evaluate(()=>JSON.parse(localStorage.examina_vocabulary_project_v1));
  const totals={};
  current.units.slice(0,current.count).forEach((unit,i)=>{
   assert.equal(unit.text,corpus.units[i].text);
   for(const row of unit.rows)totals[row.status]=(totals[row.status]||0)+1;
  });
  assert(totals.documented>=2047);
  assert.equal(current.units.slice(0,current.count).flatMap(u=>u.rows).filter(r=>
   r.form.toLowerCase()==='est'&&r.status==='review'&&r.candidates.some(c=>c.lemma==='edo')).length,64);
  assert(totals.unknown<=2);
  const ud1=current.units[0].rows;
  for(const [form,lemma] of [['esse','sum'],['dare','do'],['potest','possum']])
   assert(ud1.some(r=>r.form.toLowerCase()===form&&r.lemma===lemma&&r.status==='documented'));
  assert(ud1.some(r=>r.form.toLowerCase()==='bona'&&r.status==='review'));
  console.log('JSON docente de Latín I · 10 unidades · '+JSON.stringify(totals));
 }

 // Regresión iPhone: la pestaña de vocabulario no debe mostrar papel ni panel del examen.
  await page.setViewportSize({width:390,height:844});
  await page.click('#vgShow');
  assert.equal(await page.locator('#examLayout').isVisible(),false,'Se ve el examen en el generador de vocabulario móvil');
  assert.equal(await page.locator('#exam-header-controls').isVisible(),false,'Se ven los menús del examen en vocabulario móvil');
  assert.equal(await page.locator('#vocabularyGenerator').isVisible(),true);
  await page.click('#vmShowList');
  assert.equal(await page.locator('#examLayout').isVisible(),false,'Se ve el examen en el gestor exigible móvil');
  assert.equal(await page.locator('#vmSuggestUnit').count(),1,'Falta importación docente revisable');
  // Las listas latinas exigibles ya se han importado una sola vez desde el
  // documento docente. Simular la retirada de una ficha por el profesor:
  // el botón de importación debe poder recuperarla bajo confirmación.
  const removedRequired=await page.evaluate(()=>{
   const index=examRequired.findIndex(x=>x.course==='latin1'&&x.unit==='UD3');
   if(index<0)return '';
   const [removed]=examRequired.splice(index,1);
   saveRequired();
   return removed.entry;
  });
  assert(removedRequired,'Falta lista exigible de Latín I UD3');
  const requiredBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('examina_required_v9')||'[]').length);
  await page.selectOption('#vmCourse','latin1');
  await page.selectOption('#vmUnit','UD3');
  page.once('dialog',dialog=>dialog.accept());
  await page.click('#vmSuggestUnit');
  const requiredAfter=await page.evaluate(()=>JSON.parse(localStorage.getItem('examina_required_v9')||'[]').length);
  assert(requiredAfter>requiredBefore,'No se ha importado el vocabulario docente bajo confirmación del profesor');
  await page.click('#vmShowExam');
  assert.equal(await page.locator('#vocabularyGenerator').isVisible(),false);
  assert.equal(await page.locator('#examLayout').isVisible(),true,'No se ha restaurado el examen al volver desde vocabulario');
 assert.deepEqual(errors,[]);console.log('Navegador offline: pestañas, unidades, persistencia y descarga DOCX correctas.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

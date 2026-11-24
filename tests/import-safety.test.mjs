import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {chromium} from '@playwright/test';
const root=fileURLToPath(new URL('../',import.meta.url));
const key='rcpc.packcalc.state';
const fixture=()=>({sets:[{id:'set-1',name:'Fixture',totalCards:1,rarities:[{id:'rarity-1',name:'Common',shortcode:'C',setCount:1,colorId:'blue'}]}],packs:[{id:'pack-1',name:'Fixture pack',setId:'set-1',cardsPerPack:1,slotPlan:['rarity-1'],packCriteria:{'rarity-1':{wildcardEligible:true}},wildcardInputs:{'rarity-1':'1/1'}}],pack:{setId:'set-1',cardsPerPack:1,slotPlan:['rarity-1']},ui:{editingSetId:'set-1',editingPackId:'pack-1'},rules:[{id:'fixture-rule',label:'Fixture rule'}]});
async function withPage(fn){
 const server=http.createServer(async(req,res)=>{
  const name=path.resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));
  if(!name.startsWith(root)){res.writeHead(403).end();return;}
  try{res.setHeader('content-type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(await readFile(name));}catch{res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true});const page=await browser.newPage();const origin=`http://127.0.0.1:${server.address().port}`;
  await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const dialogs=[];page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
  await page.goto(origin);await fn(page,dialogs);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
}
async function load(page,input){await page.evaluate(text=>{document.getElementById('configJson').value=text;document.getElementById('loadJsonBtn').click();},JSON.stringify(input));}
async function safe(page){assert.equal(await page.evaluate(()=>window.__fixtureExecuted??false),false);assert.equal(await page.locator('img[data-import-fixture]').count(),0);}
for(const kind of ['set','rarity','pack','rule']){
 test(`rejects unsafe ${kind} identifiers on import and stored-state restoration`,()=>withPage(async(page,dialogs)=>{
  await load(page,fixture());assert.equal(dialogs.length,0);
  const before=await page.evaluate(k=>localStorage.getItem(k),key);assert(before);
  const bad=fixture();const id='invalid"><img data-import-fixture src=/missing onerror="window.__fixtureExecuted=true">';
  if(kind==='set')bad.sets[0].id=id;
  if(kind==='rarity')bad.sets[0].rarities[0].id=id;
  if(kind==='pack')bad.packs[0].id=id;
  if(kind==='rule')bad.rules[0].id=id;
  await load(page,bad);await safe(page);assert(dialogs.some(s=>s.includes('migrated safely')));
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'Rejected import must preserve the prior configuration');
  await page.evaluate(({key,bad})=>localStorage.setItem(key,JSON.stringify(bad)),{key,bad});await page.reload();await safe(page);
  assert(await page.locator('body').innerText().then(s=>s.includes('Stored state could not be restored')));
 }));
}
test('preserves valid identifiers, cross references, editing and reload',()=>withPage(async(page,dialogs)=>{
 await load(page,fixture());assert.equal(dialogs.length,0);
 let state=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 assert.equal(state.packs[0].setId,'set-1');assert.deepEqual(state.packs[0].slotPlan,['rarity-1']);assert.equal(state.sets[0].rarities[0].id,'rarity-1');
 await page.evaluate(()=>{const n=document.querySelector('[data-role="rarity-name"]');n.value='Updated common';n.dispatchEvent(new Event('input',{bubbles:true}));n.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.reload();state=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(state.sets[0].rarities[0].name,'Updated common');await safe(page);
}));

test('rejects unsafe references and reserved keyed identifiers without changing the saved configuration',()=>withPage(async(page,dialogs)=>{
 await load(page,fixture());
 const before=await page.evaluate(k=>localStorage.getItem(k),key);
 for(const change of [
  input=>{input.packs[0].setId='invalid" reference';},
  input=>{input.packs[0].slotPlan=['invalid<slot>'];},
  input=>{input.ui.editingPackId='invalid\nreference';},
  input=>{input.packs[0].packCriteria=Object.fromEntries([['__proto__',{wildcardEligible:true}]]);},
  input=>{input.packs[0].wildcardInputs={constructor:'1/1'};},
  input=>{input.ui.nudgePins={prototype:true};},
 ]){
  const input=fixture();change(input);const count=dialogs.length;
  await load(page,input);await safe(page);
  assert.equal(dialogs.length,count+1,'Unsafe references must be rejected before changing state');
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before);
 }
}));

test('valid imported configurations retain calculation, undo/redo, configuration save and report export',()=>withPage(async(page,dialogs)=>{
 const input=fixture();input.ui.reportFormat='json';
 await load(page,input);assert.equal(dialogs.length,0);
 await page.waitForFunction(()=>document.getElementById('calcStatus').value==='Calculated');
 await page.evaluate(()=>{const n=document.querySelector('[data-role="rarity-name"]');n.value='Edited common';n.dispatchEvent(new Event('input',{bubbles:true}));n.dispatchEvent(new Event('change',{bubbles:true}));});
 const rarityName=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)).sets[0].rarities[0].name,key);
 assert.equal(await rarityName(),'Edited common');
 // Input rendering replaces the edited element; commit through its current DOM control.
 await page.evaluate(()=>document.querySelector('[data-role="rarity-name"]').dispatchEvent(new Event('change',{bubbles:true})));
 await page.evaluate(()=>document.getElementById('undoBtn').click());assert.equal(await rarityName(),'Common');
 await page.evaluate(()=>document.getElementById('redoBtn').click());assert.equal(await rarityName(),'Edited common');
 // Exercise the supported download fallback without opening a host file picker.
 await page.evaluate(()=>{window.showSaveFilePicker=undefined;});
 const [config]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>document.getElementById('saveConfigBtn').click())]);
 const saved=JSON.parse(await readFile(await config.path(),'utf8'));
 assert.equal(saved.sets[0].rarities[0].name,'Edited common');
 assert.equal(saved.packs[0].setId,'set-1');assert.deepEqual(saved.packs[0].slotPlan,['rarity-1']);
 const [report]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>document.getElementById('exportReportBtn').click())]);
 assert.equal(report.suggestedFilename(),'pack-report.json');
 const exported=JSON.parse(await readFile(await report.path(),'utf8'));
 assert.equal(exported.report.pack.id,'pack-1');
 assert.deepEqual(exported.report.totals,{totalCards:216,totalPacks:216});
 await page.reload();await safe(page);assert.equal(await rarityName(),'Edited common');
}));

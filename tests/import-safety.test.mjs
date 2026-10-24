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
async function load(page,input){await page.evaluate(value=>{document.getElementById('configJson').value=JSON.stringify(value);document.getElementById('loadJsonBtn').click();},input);}
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

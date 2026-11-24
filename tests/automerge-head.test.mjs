import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,delimiter} from 'node:path';
import {spawnSync} from 'node:child_process';
const A='a'.repeat(40),B='b'.repeat(40);
const workflow=readFileSync(new URL('../.github/workflows/auto-merge.yml',import.meta.url),'utf8');
const marker='        run: |\n';assert.equal(workflow.split(marker).length,2,'Execute the actual single auto-merge shell block');
const shell=workflow.split(marker)[1].split('\n').map(line=>line.startsWith('          ')?line.slice(10):line).join('\n');
function run({event={},pr={},mergeHead=A}={}){
 const dir=mkdtempSync(join(tmpdir(),'automerge-head-'));
 try{
  const run={event:'pull_request',conclusion:'success',head_sha:A,pull_requests:[{number:123}],...event};
  const pull={state:'open',draft:false,head:{sha:A,repo:{full_name:'fixture/repo'}},author_association:'OWNER',labels:[{name:'automerge'}],...pr};
  writeFileSync(join(dir,'event.json'),JSON.stringify({workflow_run:run}));writeFileSync(join(dir,'pull.json'),JSON.stringify(pull));
  writeFileSync(join(dir,'gh'),`#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),dir=process.env.FIXTURE_DIR,args=process.argv.slice(2);
fs.appendFileSync(path.join(dir,'calls'),JSON.stringify(args)+'\\n');
if(args[0]==='api'){console.log(fs.readFileSync(path.join(dir,'pull.json'),'utf8'));process.exit(0);}
if(args[0]==='pr'&&args[1]==='merge'){
 const at=args.indexOf('--match-head-commit');
 if(at>=0&&args[at+1]!==process.env.MERGE_HEAD)process.exit(1);
 fs.writeFileSync(path.join(dir,'merged'),'yes');process.exit(0);
}
process.exit(86);
`,{mode:0o700});
  const result=spawnSync('bash',['-c',shell],{env:{...process.env,PATH:dir+delimiter+process.env.PATH,FIXTURE_DIR:dir,MERGE_HEAD:mergeHead,GITHUB_EVENT_PATH:join(dir,'event.json'),REPOSITORY:'fixture/repo',GH_TOKEN:'fixture-only-no-network',HEAD_SHA:run.head_sha??''},encoding:'utf8',timeout:10000});
  assert.equal(result.error,undefined);return{status:result.status,merged:existsSync(join(dir,'merged')),calls:existsSync(join(dir,'calls'))?readFileSync(join(dir,'calls'),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[]};
 }finally{rmSync(dir,{recursive:true,force:true});}
}
test('a current trusted labeled head merges with the exact validated SHA precondition',()=>{
 const r=run();assert.equal(r.status,0);assert.equal(r.merged,true);const args=r.calls.find(a=>a[0]==='pr');assert(args);assert.equal(args[args.indexOf('--match-head-commit')+1],A);assert(args.includes('--squash'));assert(args.includes('--delete-branch'));
});
test('a stale workflow cannot merge a newer PR head',()=>{
 const r=run({pr:{head:{sha:B,repo:{full_name:'fixture/repo'}}},mergeHead:B});assert.equal(r.status,0);assert.equal(r.merged,false);assert(!r.calls.some(a=>a[0]==='pr'));
});
test('a push after metadata inspection is rejected by the merge precondition',()=>{
 const r=run({mergeHead:B});assert.notEqual(r.status,0);assert.equal(r.merged,false);assert(r.calls.some(a=>a[0]==='pr'));
});
test('only successful pull-request workflow events can reach GitHub',()=>{
 for(const event of [{event:'push'},{event:'pull_request_target'},{conclusion:'failure'},{conclusion:'cancelled'}]){const r=run({event});assert.equal(r.status,0);assert.equal(r.merged,false);assert.deepEqual(r.calls,[]);}
});
test('missing or malformed validated revisions fail closed before GitHub access',()=>{
 for(const head_sha of ['',null,'not-a-sha']){const r=run({event:{head_sha}});assert.equal(r.status,0);assert.equal(r.merged,false);assert.deepEqual(r.calls,[]);}
});
test('workflow without an associated PR has no side effects',()=>{const r=run({event:{pull_requests:[]}});assert.equal(r.status,0);assert.equal(r.merged,false);assert.deepEqual(r.calls,[]);});
test('original open, non-draft, same-repository, label and author gates remain effective',()=>{
 for(const pr of [{state:'closed'},{draft:true},{head:{sha:A,repo:{full_name:'outside/fork'}}},{labels:[]},{author_association:'CONTRIBUTOR'}]){const r=run({pr});assert.equal(r.status,0);assert.equal(r.merged,false);assert(!r.calls.some(a=>a[0]==='pr'));}
});
test('all existing trusted collaborator associations remain supported',()=>{
 for(const author_association of ['OWNER','MEMBER','COLLABORATOR']){const r=run({pr:{author_association}});assert.equal(r.status,0);assert.equal(r.merged,true);}
});

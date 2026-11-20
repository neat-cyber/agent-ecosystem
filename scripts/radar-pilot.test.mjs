import test from 'node:test';
import assert from 'node:assert/strict';
import {callRadar,pinnedPackage,selectedFromLock,ENDPOINT} from './radar-pilot.mjs';
test('selects only requested pinned direct dependencies, refusing ranges, workspaces and missing entries',()=>{
 const lock={lockfileVersion:3,packages:{'':{dependencies:{lodash:'^4.17.0',workspace:'*'}},'node_modules/lodash':{version:'4.17.21'},'node_modules/child':{version:'1.0.0'},'node_modules/workspace':{link:true}}};
 assert.deepEqual(selectedFromLock(lock,['lodash']),[{ecosystem:'npm',package_name:'lodash',version:'4.17.21'}]);
 for(const names of [[],['child'],['workspace']])assert.throws(()=>selectedFromLock(lock,names));
 for(const value of ['npm:lodash@^4.17.0','npm:lodash@latest','npm:file:foo@1.0.0','npm:a b@1.0.0'])assert.throws(()=>pinnedPackage(value));
 assert.equal(pinnedPackage('npm:@scope/name@1.2.3').package_name,'@scope/name');
 assert.equal(pinnedPackage('PyPI:requests@2.32.3').ecosystem,'PyPI');
});
test('initializes and discovers schemas, sends only public identifiers and keeps the token out of receipts',async()=>{
 const messages=[];const token='A'.repeat(43);
 const receipt=await callRadar([pinnedPackage('npm:lodash@4.17.21')],{token,fetchImpl:async(url,options)=>{
  assert.equal(url,ENDPOINT);assert.equal(options.redirect,'error');assert.equal(options.headers['X-Oseille-Pilot-Token'],token);
  const m=JSON.parse(options.body);messages.push(m);
  if(m.id===undefined)return new Response(null,{status:202});
  const result=m.id===1?{protocolVersion:'2025-03-26'}:m.id===2?{tools:[{name:'release_gate'}]}:{content:[{type:'text',text:'{"evaluated":1}'}]};
  return new Response(JSON.stringify({jsonrpc:'2.0',id:m.id,result}),{headers:{'content-type':'application/json'}});
 }});
 assert.deepEqual(messages.map(m=>m.method),['initialize','notifications/initialized','tools/list','tools/call']);
 assert.doesNotMatch(JSON.stringify(receipt),new RegExp(token));
 assert.equal(receipt.attribution,'enrollment_token_supplied_server_verification_required');
});
test('does not retry HTTP errors or send oversized selections',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;return new Response('{}',{status:429});};
 await assert.rejects(()=>callRadar([pinnedPackage('npm:lodash@4.17.21')],{fetchImpl}),/HTTP 429/);assert.equal(calls,1);
 await assert.rejects(()=>callRadar(Array(4).fill(pinnedPackage('npm:lodash@4.17.21')),{fetchImpl}),/1–3/);assert.equal(calls,1);
});

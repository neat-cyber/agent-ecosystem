#!/usr/bin/env node
// Node 22+. No dependencies, package installs, background polling or automatic retries.
import {readFile, writeFile, stat} from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
export const ENDPOINT='https://agent-dependency-radar.saromy-export.workers.dev/mcp';
export function pinnedPackage(text){
 const match=/^(npm|PyPI):([^\s:]+)@([^\s@]+)$/.exec(text);
 if(!match)throw Error('Use npm:package@exact-version or PyPI:package@exact-version.');
 const [,ecosystem,package_name,version]=match;
 if(!/^[A-Za-z0-9@/_.-]+$/.test(package_name)||!/^[0-9][A-Za-z0-9.!+_-]*$/.test(version))throw Error('Only public package names and exact numeric release versions are supported.');
 return {ecosystem,package_name,version};
}
export function selectedFromLock(lock,names){
 if(![2,3].includes(lock.lockfileVersion)||!lock.packages?.[''])throw Error('Use an npm package-lock v2 or v3.');
 if(!names.length)throw Error('Choose 1–3 direct dependencies with --select name,name.');
 const root=lock.packages[''];
 const direct={...root.dependencies,...root.devDependencies,...root.optionalDependencies};
 return names.map(name=>{
  if(!Object.hasOwn(direct,name))throw Error('Selected package must be a direct dependency: '+name);
  const entry=lock.packages['node_modules/'+name];
  if(!entry?.version||entry.link)throw Error('No pinned registry version found: '+name);
  return pinnedPackage('npm:'+name+'@'+entry.version);
 });
}
export async function callRadar(packages,{token,fetchImpl=fetch,headersFor=()=>({})}={}){
 if(packages.length<1||packages.length>3)throw Error('Choose 1–3 pinned packages. No silent truncation.');
 if(new Set(packages.map(p=>p.ecosystem+':'+p.package_name)).size!==packages.length)throw Error('Choose each package once.');
 if(token&&!/^[A-Za-z0-9_-]{43}$/.test(token))throw Error('Invalid pilot token format.');
 const requestId=randomUUID();let session;let protocol='2025-03-26';
 async function rpc(message){
  const response=await fetchImpl(ENDPOINT,{method:'POST',redirect:'error',signal:AbortSignal.timeout(35000),headers:{'Content-Type':'application/json','Accept':'application/json, text/event-stream','MCP-Protocol-Version':protocol,...(session?{'Mcp-Session-Id':session}:{}),...(token?{'X-Oseille-Pilot-Token':token,'X-Oseille-Request-Id':requestId}:{}),...await headersFor(message)},body:JSON.stringify(message)});
  if(!response.ok)throw Error('MCP HTTP '+response.status+'. No automatic retry was sent.');
  session=response.headers.get('mcp-session-id')||session;
  if(message.id===undefined){await response.body?.cancel();return;}
  if(!/application\/json/i.test(response.headers.get('content-type')||''))throw Error('Expected JSON from the hosted Radar endpoint.');
  const data=await response.json();
  if(data.id!==message.id||data.error)throw Error('MCP request failed; inspect the server schema and quota.');
  return data.result;
 }
 const init=await rpc({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:protocol,capabilities:{},clientInfo:{name:'agent-ecosystem-voluntary-pilot',version:'1.0.0'}}});
 protocol=init.protocolVersion;
 await rpc({jsonrpc:'2.0',method:'notifications/initialized'});
 const tools=await rpc({jsonrpc:'2.0',id:2,method:'tools/list',params:{}});
 if(!tools.tools?.some(t=>t.name==='release_gate'))throw Error('release_gate is unavailable.');
 const result=await rpc({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'release_gate',arguments:{packages}}});
 return {schema_version:1,recorded_at:new Date().toISOString(),service:'Agent Dependency Radar',tool:'release_gate',request_id:requestId,attribution:token?'enrollment_token_supplied_server_verification_required':'unknown',scope:'Only the selected public pinned versions; no full project or transitive audit.',packages,result};
}
export async function main(args=process.argv.slice(2)){
 const {values:v}=parseArgs({args,options:{package:{type:'string',multiple:true},lock:{type:'string'},select:{type:'string'},output:{type:'string',default:'radar-result.json'},'dry-run':{type:'boolean'},'send-public-identifiers':{type:'boolean'},help:{type:'boolean'}}});
 if(v.help){console.log('node radar-pilot.mjs --package npm:lodash@4.17.21 --dry-run\nnode radar-pilot.mjs --lock package-lock.json --select lodash,axios --send-public-identifiers\nOptional OSEILLE_PILOT_TOKEN from a verified invitation. Reports are local.');return;}
 if(v.lock&&v.package?.length)throw Error('Choose a lockfile selection or explicit packages.');
 if(v.select&&!v.lock)throw Error('--select requires --lock.');
 let packages;
 if(v.lock){if((await stat(v.lock)).size>20_000_000)throw Error('Lockfile exceeds 20 MB.');packages=selectedFromLock(JSON.parse(await readFile(v.lock,'utf8')),(v.select||'').split(',').filter(Boolean));}
 else packages=(v.package||[]).map(pinnedPackage);
 if(packages.length<1||packages.length>3)throw Error('Choose 1–3 pinned packages.');
 if(v['dry-run']){console.log(JSON.stringify({endpoint:ENDPOINT,tool:'release_gate',packages,network_requests:0},null,2));return;}
 if(!v['send-public-identifiers'])throw Error('Review with --dry-run, then pass --send-public-identifiers. Never submit private package identifiers.');
 const report=await callRadar(packages,{token:process.env.OSEILLE_PILOT_TOKEN});
 // Exclusive create protects an existing result and any existing symlink target.
 await writeFile(v.output,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log('Saved local result to '+v.output+'. '+report.attribution+'.');
 if(report.result.isError)process.exitCode=2;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});

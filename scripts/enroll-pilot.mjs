#!/usr/bin/env node
// Operator-only preparation. Generates private files; never calls Cloudflare or a participant.
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';
export function enrollment({evidenceUrl,verifiedIndependent,now=Date.now(),consumerId=randomUUID()}){
 if(!verifiedIndependent)throw Error('Review independence evidence before issuing a credential.');
 if(!/^https:\/\/github\.com\/neat-cyber\/agent-ecosystem\/issues\/[1-9][0-9]*(?:#issuecomment-[0-9]+)?$/.test(evidenceUrl||''))throw Error('Provide the reviewed public pilot request URL.');
 if(!/^[a-f0-9-]{36}$/.test(consumerId))throw Error('Use an opaque UUID for the team, never a name or email.');
 const token=randomBytes(32).toString('base64url');
 const digest=createHash('sha256').update(token).digest('hex');
 const verified=new Date(now).toISOString(),expires=new Date(now+30*86400000).toISOString();
 return {token,consumerId,expires,request:{batch:[
  {sql:'INSERT INTO mcp_pilot_enrollments_v4 (consumer_id,evidence_url,verified_at,expires_at,scope) VALUES (?,?,?,?,?)',params:[consumerId,evidenceUrl,verified,expires,'agent-dependency-radar']},
  {sql:'INSERT INTO mcp_pilot_credentials_v4 (token_digest,consumer_id,expires_at,revoked_at) VALUES (?,?,?,NULL)',params:[digest,consumerId,expires]}
 ]},revocation:{sql:'UPDATE mcp_pilot_credentials_v4 SET revoked_at=? WHERE consumer_id=?',params:[verified,consumerId]}};
}
export async function main(args=process.argv.slice(2)){
 const {values:v}=parseArgs({args,options:{'evidence-url':{type:'string'},'verified-independent':{type:'boolean'},'output-dir':{type:'string'},help:{type:'boolean'}}});
 if(v.help){console.log('Operator: --evidence-url https://github.com/neat-cyber/agent-ecosystem/issues/N --verified-independent --output-dir PRIVATE_NEW_DIRECTORY. Review the request, then submit enrollment-request.json to the production ecosystem D1 query API. Share pilot-token.txt privately only.');return;}
 if(!v['output-dir'])throw Error('Choose a new private output directory.');
 const p=enrollment({evidenceUrl:v['evidence-url'],verifiedIndependent:v['verified-independent']});
 await mkdir(v['output-dir'],{mode:0o700});
 await writeFile(v['output-dir']+'/pilot-token.txt',p.token+'\n',{mode:0o600,flag:'wx'});
 await writeFile(v['output-dir']+'/enrollment-request.json',JSON.stringify(p.request,null,2)+'\n',{mode:0o600,flag:'wx'});
 await writeFile(v['output-dir']+'/revocation-request.json',JSON.stringify(p.revocation,null,2)+'\n',{mode:0o600,flag:'wx'});
 console.log('Prepared opaque team '+p.consumerId+'. Expires '+p.expires+'. Not enrolled until the D1 batch succeeds. Token was not printed.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});

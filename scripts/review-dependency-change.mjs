#!/usr/bin/env node
import {callRadar,pinnedPackage} from './radar-pilot.mjs';
import {writeFile} from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';
export function compareChange(before,after){
 const left=before.packages?.[0],right=after.packages?.[0];
 if(!left||!right||left.ecosystem!==right.ecosystem||left.package_name!==right.package_name||left.version===right.version)throw Error('Compare two different pinned versions of the same public package.');
 const evidence=report=>{
  const data=report.result?.structuredContent,row=data?.results?.[0],p=report.packages[0];
  const identity=row?.package?.ecosystem===p.ecosystem&&row?.package?.name===p.package_name&&row?.package?.installed_version===p.version;
  const list=Array.isArray(row?.installed_sample)?row.installed_sample:[];
  const ids=list.map(a=>a?.id).filter(x=>typeof x==='string');
  const count=row?.installed_known_advisories;
  const complete=!report.result?.isError&&data?.evaluated===1&&data.results.length===1&&row.status==='evaluated'&&identity&&row.installed_version_verified===true&&row.data_complete===true&&Number.isInteger(count)&&count>=0&&count===ids.length&&new Set(ids).size===count;
  return {version:p.version,complete,known_count:Number.isInteger(count)?count:null,advisories:list,checked_at:row?.source_checked_at,ids};
 };
 const a=evidence(before),b=evidence(after),complete=a.complete&&b.complete;
 const removed=complete?a.ids.filter(x=>!b.ids.includes(x)):[],introduced=complete?b.ids.filter(x=>!a.ids.includes(x)):[];
 return {schema_version:1,kind:'dependency_change_review',package:left.package_name,ecosystem:left.ecosystem,from:a.version,to:b.version,checked_at:new Date().toISOString(),evidence_complete:complete,
  decision:!complete?'BLOCK_INCOMPLETE':introduced.length?'REVIEW_NEW_ADVISORIES':b.known_count?'REVIEW_REMAINING_ADVISORIES':'READY_FOR_COMPATIBILITY_REVIEW',automatic_upgrade_authorized:false,automatic_deploy_authorized:false,
  before:{version:a.version,known_advisories:a.known_count,checked_at:a.checked_at},after:{version:b.version,known_advisories:b.known_count,checked_at:b.checked_at},
  advisory_ids_not_observed_in_target:removed,advisory_ids_newly_observed_in_target:introduced,
  evidence:{before:a.advisories,after:b.advisories},
  required_next_steps:['Review the cited advisory records and affected-version ranges.','Read release notes for the exact target version.','Run your project tests, build and integration checks.','Review transitive dependencies separately before a release decision.'],
  limits:['Known advisory comparison only; absence of an ID is not proof a vulnerability was fixed.','No changelog parsing, source-code review, full lockfile scan or behavior/compatibility analysis.','This is publisher-provided tooling; a generated report does not prove independent adoption.']};
}
export async function reviewChange({ecosystem,name,from,to},{token,fetchImpl,headersFor}={}){
 const packages=[from,to].map(v=>pinnedPackage(ecosystem+':'+name+'@'+v));
 if(from===to)throw Error('Choose a different target version.');
 // Two selected-version checks only. Sequential calls, no automatic retry or full-project scan.
 const before=await callRadar([packages[0]],{token,fetchImpl,headersFor});
 const after=await callRadar([packages[1]],{token,fetchImpl,headersFor});
 return compareChange(before,after);
}
export async function main(args=process.argv.slice(2)){
 const {values:v}=parseArgs({args,options:{ecosystem:{type:'string',default:'npm'},name:{type:'string'},from:{type:'string'},to:{type:'string'},output:{type:'string',default:'dependency-change.json'},'dry-run':{type:'boolean'},'send-public-identifiers':{type:'boolean'}}});
 const packages=[v.from,v.to].map(x=>pinnedPackage(v.ecosystem+':'+v.name+'@'+x));
 if(v.from===v.to)throw Error('Choose a different target version.');
 if(v['dry-run']){console.log(JSON.stringify({packages,tool:'release_gate',calls:2,network_requests:0},null,2));return;}
 if(!v['send-public-identifiers'])throw Error('Preview with --dry-run and confirm public identifiers with --send-public-identifiers.');
 const report=await reviewChange({ecosystem:v.ecosystem,name:v.name,from:v.from,to:v.to},{token:process.env.OSEILLE_PILOT_TOKEN});
 await writeFile(v.output,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(report.decision+'. Saved '+v.output+'. No upgrade or deployment performed.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});

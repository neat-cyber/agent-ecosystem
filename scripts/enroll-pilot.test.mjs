import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {enrollment} from './enroll-pilot.mjs';
test('requires reviewed evidence and generates expiring credentials without storing the bearer token in D1 payloads',()=>{
 const evidenceUrl='https://github.com/neat-cyber/agent-ecosystem/issues/2';
 assert.throws(()=>enrollment({evidenceUrl}),/Review independence/);
 assert.throws(()=>enrollment({evidenceUrl:'https://elsewhere.example/',verifiedIndependent:true}),/reviewed/);
 const p=enrollment({evidenceUrl,verifiedIndependent:true,now:0});
 assert.match(p.token,/^[A-Za-z0-9_-]{43}$/);
 assert.equal(p.expires,'1970-01-31T00:00:00.000Z');
 assert.equal(p.request.batch[1].params[0],createHash('sha256').update(p.token).digest('hex'));
 assert.doesNotMatch(JSON.stringify(p.request),new RegExp(p.token));
 assert.equal(p.request.batch[0].params[0],p.request.batch[1].params[1]);
});

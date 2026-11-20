const BUSINESS=['release_gate','dependency_preflight'];
export async function adoption(env){
 const measured_at=new Date().toISOString();
 try{
  const db=env.ECOSYSTEM_DB;
  const counts=await db.prepare("SELECT event_type,tool,origin_class,outcome,COUNT(*) calls FROM mcp_reporting_v4 WHERE service='agent-dependency-radar' AND recorded_at>=strftime('%Y-%m-%dT%H:%M:%fZ','now','-30 days') GROUP BY event_type,tool,origin_class,outcome").all();
  const cohorts=await db.prepare("SELECT consumer_id,MIN(recorded_at) first_success,MAX(recorded_at) last_success,COUNT(DISTINCT CASE WHEN recorded_at>=strftime('%Y-%m-%dT%H:%M:%fZ','now','-7 days') THEN substr(recorded_at,1,10) END) active_days_7,COUNT(DISTINCT CASE WHEN recorded_at>=strftime('%Y-%m-%dT%H:%M:%fZ','now','-30 days') THEN substr(recorded_at,1,10) END) active_days_30 FROM mcp_events_v4_detail WHERE service='agent-dependency-radar' AND event_type='mcp.tool_call' AND tool IN ('release_gate','dependency_preflight') AND origin_class='verified_external' AND outcome='ok' AND consumer_id IS NOT NULL GROUP BY consumer_id").all();
  const enrolled=await db.prepare("SELECT COUNT(DISTINCT consumer_id) teams FROM mcp_pilot_credentials_v4 WHERE revoked_at IS NULL AND expires_at>strftime('%Y-%m-%dT%H:%M:%fZ','now')").first();
  const rows=counts.results||[],teams=cohorts.results||[];
  const calls=(origin,ok=false)=>rows.filter(r=>r.event_type==='mcp.tool_call'&&BUSINESS.includes(r.tool)&&r.origin_class===origin&&(!ok||r.outcome==='ok')).reduce((n,r)=>n+Number(r.calls),0);
  const retention=days=>{
   const now=Date.parse(measured_at),minimum=days*86400000;
   const eligible=teams.filter(t=>now-Date.parse(t.first_success)>=minimum);
   const retained=eligible.filter(t=>Date.parse(t.last_success)-Date.parse(t.first_success)>=minimum);
   return {eligible_teams:eligible.length,returned_after_interval:retained.length,rate:eligible.length?retained.length/eligible.length:null};
  };
  return {available:true,measured_at,service:'Agent Dependency Radar',window_days:30,active_enrolled_teams:Number(enrolled?.teams||0),verified_business_calls:calls('verified_external'),verified_successful_business_calls:calls('verified_external',true),unknown_successful_business_calls:calls('unknown',true),verified_teams_7_days:teams.filter(t=>t.active_days_7>0).length,verified_teams_30_days:teams.filter(t=>t.active_days_30>0).length,repeated_on_distinct_utc_days_7:teams.filter(t=>t.active_days_7>=2).length,repeated_on_distinct_utc_days_30:teams.filter(t=>t.active_days_30>=2).length,retention_7_days:retention(7),retention_30_days:retention(30),request_counts:rows,definitions:{business_tools:BUSINESS,discovery:'Request counts only; no unique visitors or individual conversion funnel.',verified:'Valid enrolled token after independence review. No identity inferred from IP or User-Agent.',recurrence:'Technical recurrence needs feedback confirming a second real decision.',retention:'All observed first-success cohorts old enough for the interval; return at least that many elapsed days after first success.',anonymous_history:'Remains unknown. No retroactive external attribution.',payments:'Disabled in production. Pilot calls are free.'}};
 }catch{return {available:false,measured_at,reason:'adoption_counter_unavailable'};}
}

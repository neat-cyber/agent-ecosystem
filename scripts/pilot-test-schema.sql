CREATE TABLE IF NOT EXISTS mcp_events_v4_detail (
  id INTEGER PRIMARY KEY,
  service TEXT NOT NULL CHECK(service IN ('agent-guardian','agent-repair','agent-signals','agent-dependency-radar')),
  event_type TEXT NOT NULL CHECK(event_type IN ('mcp.initialize','mcp.tools_list','mcp.tool_call','mcp.protocol_error')),
  tool TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK(outcome IN ('ok','error','skipped','rate_limited','upstream_error','incomplete','discovered')),
  error_category TEXT,
  duration_ms INTEGER NOT NULL CHECK(duration_ms >= 0),
  worker_version TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  origin_class TEXT NOT NULL CHECK(origin_class IN ('verified_internal_test','declared_test','likely_probe','unknown','verified_external')),
  consumer_id TEXT,
  payment_state TEXT NOT NULL CHECK(payment_state IN ('not_applicable','testnet_challenge','testnet_rejected','testnet_pending_or_failed','testnet_delivery')),
  recorded_at TEXT NOT NULL,
  CHECK((origin_class='verified_external') = (consumer_id IS NOT NULL)),
  UNIQUE(service,correlation_id)
);

CREATE INDEX IF NOT EXISTS idx_mcp_v4_detail_time ON mcp_events_v4_detail(recorded_at);

CREATE TABLE IF NOT EXISTS mcp_pilot_credentials_v4 (
  token_digest TEXT PRIMARY KEY CHECK(length(token_digest)=64),
  consumer_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);

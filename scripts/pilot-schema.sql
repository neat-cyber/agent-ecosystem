-- Additive audit metadata; existing events and credentials are preserved.
CREATE TABLE IF NOT EXISTS mcp_pilot_enrollments_v4 (
 consumer_id TEXT PRIMARY KEY,
 evidence_url TEXT NOT NULL,
 verified_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 scope TEXT NOT NULL CHECK(scope='agent-dependency-radar')
);

-- BCB tester leads (Cloudflare D1 / SQLite)
CREATE TABLE IF NOT EXISTS leads (
  id           TEXT PRIMARY KEY,
  created_at   TEXT NOT NULL,
  email        TEXT NOT NULL,
  company      TEXT,
  use_case     TEXT,
  data_sample  TEXT,           -- JSON array of {type,label,value}
  lang         TEXT NOT NULL DEFAULT 'EN',
  status       TEXT NOT NULL DEFAULT 'new'
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);

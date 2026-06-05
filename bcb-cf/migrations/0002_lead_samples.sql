-- Separate packet data samples (PII-free) from the contact/meta in `leads`.
-- Each submitted data item becomes one row here, linked to its lead.
CREATE TABLE IF NOT EXISTS lead_samples (
  id         TEXT PRIMARY KEY,
  lead_id    TEXT NOT NULL,
  type       TEXT,
  label      TEXT,
  value      TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES leads (id)
);

CREATE INDEX IF NOT EXISTS idx_lead_samples_lead_id ON lead_samples (lead_id);

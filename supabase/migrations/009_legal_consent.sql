-- Migration 009: Legal consent tracking (M7b.6)
-- Stores AGB + Datenschutz acceptance with timestamp and version per user

CREATE TABLE IF NOT EXISTS user_consents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_version   TEXT NOT NULL,
  accepted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hint         TEXT,        -- optional: last 2 octets only, for audit purposes
  UNIQUE (user_id, legal_version)
);

-- RLS: users can only read their own consents; inserts via service-role API
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_consents_read_own" ON user_consents
  FOR SELECT USING (user_id = auth.uid());

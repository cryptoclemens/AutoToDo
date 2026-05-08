-- Migration 024: Multi-Use Friends Codes
-- Friends-Codes können nun mehrfach eingelöst werden (max_uses > 1).
-- Jede Einlösung wird separat in friends_code_redemptions protokolliert.

ALTER TABLE friends_codes
  ADD COLUMN IF NOT EXISTS max_uses  INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS use_count INTEGER NOT NULL DEFAULT 0;

-- Bestehende eingelöste Codes gelten als 1× verwendet
UPDATE friends_codes SET use_count = 1 WHERE redeemed_at IS NOT NULL;

-- Detail-Tabelle: eine Zeile pro Einlösung
CREATE TABLE IF NOT EXISTS friends_code_redemptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id               UUID NOT NULL REFERENCES friends_codes(id) ON DELETE CASCADE,
  redeemed_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  redeemed_by_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL
);

ALTER TABLE friends_code_redemptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_fcr_code_id ON friends_code_redemptions(code_id);

-- Migration 011: Freemium-Modell
-- Plan-Spalten auf workspaces, project_guests, workspace_usage

-- Tier-Definition auf workspaces
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'beta'
    CHECK (plan IN ('beta','free','solo','team','business')),
  ADD COLUMN IF NOT EXISTS plan_seats INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Gast-Zugang je LOP-Projekt
CREATE TABLE IF NOT EXISTS project_guests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  token           TEXT NOT NULL UNIQUE,
  role            TEXT NOT NULL DEFAULT 'guest'
                  CHECK (role IN ('guest')),
  invited_by      UUID REFERENCES auth.users(id),
  expires_at      TIMESTAMPTZ DEFAULT now() + INTERVAL '30 days',
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, email)
);

-- Nutzungszähler (für Transkript-Limit im Free-Tier)
CREATE TABLE IF NOT EXISTS workspace_usage (
  workspace_id      UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  transcripts_month INTEGER DEFAULT 0,
  period_start      DATE DEFAULT date_trunc('month', now()),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- RLS für project_guests
ALTER TABLE project_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guest_workspace_isolation" ON project_guests
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- RLS für workspace_usage (nur Admins lesen)
ALTER TABLE workspace_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_workspace_isolation" ON workspace_usage
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Index für schnelle Guest-Token-Lookups
CREATE INDEX IF NOT EXISTS idx_project_guests_token ON project_guests(token);
CREATE INDEX IF NOT EXISTS idx_project_guests_project ON project_guests(project_id);

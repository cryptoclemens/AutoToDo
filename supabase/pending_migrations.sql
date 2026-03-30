-- ============================================================
-- PENDING MIGRATIONS: 009, 011, 012
-- Supabase SQL Editor: https://supabase.com/dashboard/project/lgnlviezjdvxgmknmfog/editor
-- Einfach diesen Block komplett kopieren und ausführen.
-- Alle Statements sind idempotent (IF NOT EXISTS / IF NOT EXISTS).
-- ============================================================


-- ── 009: Legal Consent Tracking ─────────────────────────────
CREATE TABLE IF NOT EXISTS user_consents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_version   TEXT NOT NULL,
  accepted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hint         TEXT,
  UNIQUE (user_id, legal_version)
);

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_consents' AND policyname = 'user_consents_read_own'
  ) THEN
    CREATE POLICY "user_consents_read_own" ON user_consents
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;


-- ── 011: Freemium-Modell ─────────────────────────────────────
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'beta'
    CHECK (plan IN ('beta','free','solo','team','business')),
  ADD COLUMN IF NOT EXISTS plan_seats INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

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

CREATE TABLE IF NOT EXISTS workspace_usage (
  workspace_id      UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  transcripts_month INTEGER DEFAULT 0,
  period_start      DATE DEFAULT date_trunc('month', now()),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE project_guests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_guests' AND policyname = 'guest_workspace_isolation'
  ) THEN
    CREATE POLICY "guest_workspace_isolation" ON project_guests
      FOR ALL USING (
        workspace_id IN (
          SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

ALTER TABLE workspace_usage ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workspace_usage' AND policyname = 'usage_workspace_isolation'
  ) THEN
    CREATE POLICY "usage_workspace_isolation" ON workspace_usage
      FOR ALL USING (
        workspace_id IN (
          SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_project_guests_token   ON project_guests(token);
CREATE INDEX IF NOT EXISTS idx_project_guests_project ON project_guests(project_id);


-- ── 012: Slack / Teams Webhook URL ──────────────────────────
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS slack_webhook_url TEXT;


-- ── Verify ──────────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'user_consents')    AS "009_user_consents",
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'project_guests')   AS "011_project_guests",
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'workspace_usage')  AS "011_workspace_usage",
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'plan') AS "011_plan_col",
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'slack_webhook_url') AS "012_slack_col";
-- Erwartetes Ergebnis: alle Werte = 1

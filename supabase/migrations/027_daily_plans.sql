-- Tagesplanung pro Nutzer & Workspace
CREATE TABLE IF NOT EXISTS daily_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  text          TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, workspace_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_plans_user_date ON daily_plans (user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_plans_workspace  ON daily_plans (workspace_id, date);

-- RLS
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_plans_own" ON daily_plans
  USING (user_id = auth.uid());

CREATE POLICY "daily_plans_insert" ON daily_plans
  FOR INSERT WITH CHECK (user_id = auth.uid());

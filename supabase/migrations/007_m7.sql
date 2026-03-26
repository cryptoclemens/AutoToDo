-- ===================================================
-- AutoToDo – Migration 007: Meilenstein 7
-- Feedback-Tabelle, project_members, api_keys RLS
-- ===================================================

-- ===================================================
-- FEEDBACK
-- ===================================================
CREATE TABLE IF NOT EXISTS feedback (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message      TEXT NOT NULL,
  category     TEXT DEFAULT 'general'
               CHECK (category IN ('general', 'bug', 'feature', 'other')),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- RLS für feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_insert_authenticated" ON feedback
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "feedback_service_role" ON feedback
  FOR ALL USING (true);

-- ===================================================
-- PROJECT-MEMBERS (Projektspezifische Mitgliedschaft)
-- ===================================================
CREATE TABLE IF NOT EXISTS project_members (
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'editor'
              CHECK (role IN ('project_admin','editor','viewer')),
  invited_by  UUID REFERENCES auth.users(id),
  joined_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- RLS für project_members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_members_read" ON project_members
  FOR SELECT USING (user_id = auth.uid());

-- Index
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- ===================================================
-- INVITATIONS: project_id Spalte hinzufügen
-- ===================================================
ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- ===================================================
-- API KEYS: RLS
-- ===================================================
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Service-Role-Zugriff (wird von API-Routes verwendet)
CREATE POLICY "api_keys_service_role" ON api_keys
  FOR ALL USING (true);

-- Index für schnelles Key-Lookup
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_workspace_id ON api_keys(workspace_id);

-- ===================================================
-- FEEDBACK INDEX
-- ===================================================
CREATE INDEX IF NOT EXISTS idx_feedback_workspace_id ON feedback(workspace_id);

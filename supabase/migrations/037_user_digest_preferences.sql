-- User-level digest frequency override (F-26)
-- Allows members to choose their own digest frequency, independent of workspace default

CREATE TABLE IF NOT EXISTS user_digest_preferences (
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  frequency    text NOT NULL DEFAULT 'workspace_default'
                CHECK (frequency IN ('workspace_default', 'daily', 'twice_weekly', 'weekly', 'disabled')),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_user_digest_prefs_workspace ON user_digest_preferences(workspace_id);

ALTER TABLE user_digest_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_digest_prefs_own" ON user_digest_preferences
  FOR ALL USING (user_id = auth.uid());

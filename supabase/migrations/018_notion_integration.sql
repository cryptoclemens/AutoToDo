-- Migration 018: Notion Integration
-- Stores encrypted Notion integration tokens per workspace

CREATE TABLE IF NOT EXISTS workspace_notion_configs (
  workspace_id   UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  encrypted_token TEXT NOT NULL,
  connected_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE workspace_notion_configs ENABLE ROW LEVEL SECURITY;

-- Only workspace admins may read/write their own config (via service role in API routes)
CREATE POLICY "notion_config_workspace_admin" ON workspace_notion_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_notion_configs.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('workspace_owner', 'workspace_admin')
    )
  );

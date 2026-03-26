-- ===================================================
-- AutoToDo – Row Level Security Policies
-- Migration: 002_rls_policies.sql
-- ===================================================

-- ===================================================
-- WORKSPACES
-- ===================================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_member_read" ON workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "workspace_owner_update" ON workspaces
  FOR UPDATE USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('workspace_owner', 'workspace_admin')
    )
  );

-- ===================================================
-- WORKSPACE-MITGLIEDER
-- ===================================================
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_read" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_admin_insert_members" ON workspace_members
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('workspace_owner', 'workspace_admin')
    )
  );

CREATE POLICY "workspace_admin_delete_members" ON workspace_members
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('workspace_owner', 'workspace_admin')
    )
  );

-- ===================================================
-- LLM-KONFIGURATION
-- Kein direkter Client-Zugriff – ausschließlich via service_role
-- ===================================================
ALTER TABLE workspace_llm_config ENABLE ROW LEVEL SECURITY;
-- Keine SELECT-Policy für authenticated role

-- ===================================================
-- API-KEYS
-- ===================================================
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_workspace_isolation" ON api_keys
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "api_keys_admin_insert" ON api_keys
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('workspace_owner', 'workspace_admin')
    )
  );

-- ===================================================
-- WEBHOOK-ENDPOINTS
-- ===================================================
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhooks_workspace_isolation" ON webhook_endpoints
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "webhooks_admin_write" ON webhook_endpoints
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('workspace_owner', 'workspace_admin')
    )
  );

-- ===================================================
-- PROJEKTE
-- ===================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_workspace_isolation" ON projects
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "project_admin_insert" ON projects
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('workspace_owner', 'workspace_admin', 'project_admin')
    )
  );

-- ===================================================
-- TRANSKRIPTE
-- ===================================================
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transcripts_workspace_isolation" ON transcripts
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "transcripts_editor_insert" ON transcripts
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('workspace_owner', 'workspace_admin', 'project_admin', 'editor')
    )
  );

-- ===================================================
-- LOP-PUNKTE
-- ===================================================
ALTER TABLE lop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lop_workspace_isolation" ON lop_items
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "lop_editor_write" ON lop_items
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('workspace_owner', 'workspace_admin', 'project_admin', 'editor')
    )
  );

CREATE POLICY "lop_editor_update" ON lop_items
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('workspace_owner', 'workspace_admin', 'project_admin', 'editor')
    )
  );

-- ===================================================
-- AUDIT-LOG
-- ===================================================
ALTER TABLE lop_item_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "history_workspace_isolation" ON lop_item_history
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ===================================================
-- EINLADUNGEN
-- ===================================================
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_workspace_isolation" ON invitations
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Token-basierter Zugriff für Einladungslinks (ohne Auth)
CREATE POLICY "invitations_token_read" ON invitations
  FOR SELECT USING (
    expires_at > now() AND accepted_at IS NULL
  );

CREATE POLICY "invitations_admin_insert" ON invitations
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('workspace_owner', 'workspace_admin')
    )
  );

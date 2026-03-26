-- ===================================================
-- AutoToDo – Performance-Indexes
-- Migration: 003_indexes.sql
-- ===================================================

-- LOP-Punkte
CREATE INDEX idx_lop_items_workspace     ON lop_items(workspace_id);
CREATE INDEX idx_lop_items_project       ON lop_items(project_id);
CREATE INDEX idx_lop_items_status        ON lop_items(status);
CREATE INDEX idx_lop_items_review        ON lop_items(requires_review) WHERE requires_review = true;

-- Projekte
CREATE INDEX idx_projects_workspace      ON projects(workspace_id);
CREATE INDEX idx_projects_archived       ON projects(archived_at) WHERE archived_at IS NULL;

-- Workspace-Mitglieder
CREATE INDEX idx_workspace_members_user  ON workspace_members(user_id);

-- Transkripte
CREATE INDEX idx_transcripts_project     ON transcripts(project_id);
CREATE INDEX idx_transcripts_status      ON transcripts(processing_status);

-- Audit-Log
CREATE INDEX idx_lop_history_item        ON lop_item_history(item_id);
CREATE INDEX idx_lop_history_workspace   ON lop_item_history(workspace_id);

-- API-Keys
CREATE INDEX idx_api_keys_workspace      ON api_keys(workspace_id);
CREATE INDEX idx_api_keys_prefix         ON api_keys(key_prefix);

-- Einladungen
CREATE INDEX idx_invitations_token       ON invitations(token);
CREATE INDEX idx_invitations_workspace   ON invitations(workspace_id);

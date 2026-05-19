-- supabase/migrations/035_workspace_bundesland.sql
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS bundesland TEXT DEFAULT NULL;

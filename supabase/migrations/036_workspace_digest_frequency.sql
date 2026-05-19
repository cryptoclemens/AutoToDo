-- supabase/migrations/036_workspace_digest_frequency.sql
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS digest_frequency TEXT NOT NULL DEFAULT 'daily'
  CONSTRAINT workspaces_digest_frequency_check
    CHECK (digest_frequency IN ('daily', 'twice_weekly', 'weekly', 'disabled'));

-- Bestehende deaktivierte Workspaces migrieren
UPDATE workspaces SET digest_frequency = 'disabled' WHERE digest_enabled = false;

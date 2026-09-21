-- Migration 046: Kalender-OAuth-Konfiguration pro Workspace (Diarisierung Phase 1 – OAuth-Track)
-- Speichert die OAuth-Tokens (verschlüsselt) für eine Kalenderquelle je Workspace.
-- Microsoft 365 (Microsoft Graph) ist der erste Provider; die Spalte ist providerneutral.
-- Die Tokens werden AES-256-GCM-verschlüsselt abgelegt (siehe lib/encryption.ts) und
-- ausschließlich über die Service-Role gelesen/geschrieben — nie an den Client.

CREATE TABLE IF NOT EXISTS workspace_calendar_configs (
  workspace_id     UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL CHECK (provider IN ('microsoft','google')),
  -- verschlüsseltes JSON: { access_token, refresh_token, expires_at (ISO), scope }
  encrypted_tokens TEXT NOT NULL,
  account_email    TEXT,
  account_name     TEXT,
  connected_by     UUID REFERENCES auth.users(id),
  connected_at     TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- RLS aktivieren, aber KEINE Policy: Zugriff ausschließlich über die Service-Role
-- (die Admin-Prüfung passiert in der API). So sind die Tokens für normale Clients
-- grundsätzlich unlesbar.
ALTER TABLE workspace_calendar_configs ENABLE ROW LEVEL SECURITY;

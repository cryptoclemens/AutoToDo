-- ===================================================
-- AutoToDo – Initiales Datenbankschema
-- Migration: 001_initial_schema.sql
-- ===================================================

-- ===================================================
-- WORKSPACES (Tenants)
-- ===================================================
CREATE TABLE workspaces (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,        -- Subdomain: "acme-consulting"
  logo_url      TEXT,
  brand_color   TEXT DEFAULT '#2563EB',      -- Hex-Farbwert
  plan          TEXT DEFAULT 'free'
                CHECK (plan IN ('free', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  suspended_at  TIMESTAMPTZ                  -- Gesperrte Workspaces
);

-- ===================================================
-- WORKSPACE-MITGLIEDER
-- ===================================================
CREATE TABLE workspace_members (
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'editor'
                CHECK (role IN ('workspace_owner','workspace_admin',
                                'project_admin','editor','viewer')),
  invited_by    UUID REFERENCES auth.users(id),
  joined_at     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

-- ===================================================
-- LLM-KONFIGURATION (BYOK)
-- ===================================================
CREATE TABLE workspace_llm_config (
  workspace_id      UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL CHECK (provider IN ('anthropic','openai','google','mistral')),
  model             TEXT NOT NULL,
  encrypted_api_key TEXT NOT NULL,        -- AES-256-GCM verschlüsselt
  key_preview       TEXT NOT NULL,        -- Erste 8 Zeichen + Maskierung (nur UI)
  last_tested_at    TIMESTAMPTZ,
  last_test_ok      BOOLEAN,
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ===================================================
-- API-KEYS
-- ===================================================
CREATE TABLE api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  key_hash      TEXT NOT NULL UNIQUE,        -- bcrypt(key)
  key_prefix    TEXT NOT NULL,               -- "ak_live_xxxx" (erste 12 Zeichen)
  scope         TEXT[] DEFAULT '{read}',
  expires_at    TIMESTAMPTZ,
  last_used_at  TIMESTAMPTZ,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  revoked_at    TIMESTAMPTZ
);

-- ===================================================
-- WEBHOOK-ENDPOINTS
-- ===================================================
CREATE TABLE webhook_endpoints (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  secret        TEXT NOT NULL,               -- HMAC-Signing-Secret
  events        TEXT[] NOT NULL,             -- ['lop.item.created', ...]
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ===================================================
-- PROJEKTE
-- ===================================================
CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  archived_at   TIMESTAMPTZ
);

-- ===================================================
-- TRANSKRIPTE
-- ===================================================
CREATE TABLE transcripts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by      UUID REFERENCES auth.users(id),
  file_path        TEXT NOT NULL,            -- Supabase Storage (AES-verschlüsselt)
  original_filename TEXT,
  meeting_date     DATE,
  processing_status TEXT DEFAULT 'pending'
                   CHECK (processing_status IN
                     ('pending','processing','done','error')),
  processing_error TEXT,
  items_created    INTEGER DEFAULT 0,
  items_updated    INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ===================================================
-- LOP-PUNKTE
-- ===================================================
CREATE TABLE lop_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
  transcript_id   UUID REFERENCES transcripts(id),
  title           TEXT NOT NULL,
  description     TEXT,
  responsible     TEXT,
  due_date        DATE,
  priority        TEXT DEFAULT 'mittel'
                  CHECK (priority IN ('hoch','mittel','niedrig')),
  status          TEXT DEFAULT 'offen'
                  CHECK (status IN ('offen','in_bearbeitung','abgeschlossen')),
  result          TEXT,
  source_quote    TEXT,                     -- Zitat aus Transkript
  ai_confidence   FLOAT,
  requires_review BOOLEAN DEFAULT false,
  sort_order      INTEGER,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Auto-Update für updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lop_items_updated_at
  BEFORE UPDATE ON lop_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===================================================
-- AUDIT-LOG
-- ===================================================
CREATE TABLE lop_item_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  item_id        UUID REFERENCES lop_items(id) ON DELETE CASCADE,
  changed_by     UUID REFERENCES auth.users(id),
  change_type    TEXT,   -- 'ai_create'|'ai_update'|'manual_edit'|'status_change'|'api_update'
  previous_values JSONB,
  new_values      JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ===================================================
-- EINLADUNGEN
-- ===================================================
CREATE TABLE invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'editor',
  token        TEXT NOT NULL UNIQUE,        -- UUID, einmalig
  invited_by   UUID REFERENCES auth.users(id),
  expires_at   TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days',
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);
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
-- Migration 004: Add columns needed for Milestone 5 (transcript processing + LLM pipeline)

-- transcripts: add storage_path alias, encrypted_content fallback, llm fields
ALTER TABLE transcripts
  ADD COLUMN IF NOT EXISTS storage_path      TEXT,
  ADD COLUMN IF NOT EXISTS encrypted_content TEXT,
  ADD COLUMN IF NOT EXISTS llm_summary       TEXT,
  ADD COLUMN IF NOT EXISTS error_message     TEXT,
  ADD COLUMN IF NOT EXISTS processed_at      TIMESTAMPTZ;

-- Backfill storage_path from file_path for existing rows
UPDATE transcripts SET storage_path = file_path WHERE storage_path IS NULL AND file_path IS NOT NULL;

-- lop_items: add source, confidence_score alias, ai_suggestion
ALTER TABLE lop_items
  ADD COLUMN IF NOT EXISTS source           TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS confidence_score FLOAT,
  ADD COLUMN IF NOT EXISTS ai_suggestion    TEXT;

-- Backfill confidence_score from ai_confidence
UPDATE lop_items SET confidence_score = ai_confidence WHERE confidence_score IS NULL AND ai_confidence IS NOT NULL;

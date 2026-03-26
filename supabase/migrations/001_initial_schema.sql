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

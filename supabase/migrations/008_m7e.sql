-- ===================================================
-- AutoToDo – Migration 008: Meilenstein 7e
-- E-Mail-Digest & Verantwortlichen-Verknüpfung
-- ===================================================

-- responsible_user_id auf lop_items (FK → auth.users)
ALTER TABLE lop_items
  ADD COLUMN IF NOT EXISTS responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lop_items_responsible_user_id
  ON lop_items(responsible_user_id);

-- digest_enabled auf workspaces (Standard: aktiv)
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS digest_enabled BOOLEAN NOT NULL DEFAULT true;

-- ===================================================
-- RPC: Workspace-Mitglieder mit E-Mail (SECURITY DEFINER)
-- Wird von GET /api/members verwendet
-- ===================================================
CREATE OR REPLACE FUNCTION get_workspace_members_with_email(p_workspace_id UUID)
RETURNS TABLE (
  user_id      UUID,
  role         TEXT,
  email        TEXT,
  display_name TEXT,
  joined_at    TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    wm.user_id,
    wm.role,
    u.email::TEXT,
    COALESCE(
      NULLIF(u.raw_user_meta_data->>'full_name', ''),
      NULLIF(u.raw_user_meta_data->>'name', ''),
      u.email
    )::TEXT AS display_name,
    wm.joined_at
  FROM workspace_members wm
  JOIN auth.users u ON u.id = wm.user_id
  WHERE wm.workspace_id = p_workspace_id
  ORDER BY wm.joined_at ASC;
$$;

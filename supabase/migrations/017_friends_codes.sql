-- Migration 017: Friends-Code-Programm + Super-Admin-Rolle
-- Super-Admins können einmalige Friends-Codes generieren.
-- Bei Einlösung wird der Workspace auf Plan 'team' upgraded.

-- Super-Admins Tabelle
CREATE TABLE IF NOT EXISTS super_admins (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email     TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Den initialen Super-Admin eintragen (wird beim ersten Login-Match befüllt)
-- Wir tragen die E-Mail ein; user_id wird via Trigger oder manuell gesetzt.
-- Als Bootstrap-Insert verwenden wir einen DO-Block:
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'clemens.pompey@vencly.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO super_admins (user_id, email)
    VALUES (v_user_id, 'clemens.pompey@vencly.com')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- Friends-Codes Tabelle
CREATE TABLE IF NOT EXISTS friends_codes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT NOT NULL UNIQUE,
  label               TEXT,                         -- Optionale Bezeichnung (z.B. "für Firma XYZ")
  created_by          UUID NOT NULL REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
  redeemed_at         TIMESTAMPTZ,
  redeemed_by_user_id UUID REFERENCES auth.users(id),
  redeemed_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS friends_codes_code_idx ON friends_codes(code);
CREATE INDEX IF NOT EXISTS friends_codes_redeemed_by_idx ON friends_codes(redeemed_by_user_id);

-- RLS: Kein direkter Zugriff von Nutzern — alles via Service-Role-Client
ALTER TABLE friends_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins  ENABLE ROW LEVEL SECURITY;

-- Super-Admins können eigene Einträge lesen
CREATE POLICY "super_admins_read_own" ON super_admins
  FOR SELECT USING (user_id = auth.uid());

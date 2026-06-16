-- F-20: LOP-Vorlagen (kopierbare Template-Listen)
CREATE TABLE IF NOT EXISTS lop_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  name         text NOT NULL,
  items        jsonb NOT NULL DEFAULT '[]',
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lop_templates_workspace ON lop_templates(workspace_id);
ALTER TABLE lop_templates ENABLE ROW LEVEL SECURITY;

-- F-28: benutzerdefinierte Status-Labels je Workspace
-- Struktur: { "offen": "Neu", "in_bearbeitung": "In Arbeit", "abgeschlossen": "Fertig", "geparkt": "Zurückgestellt" }
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS status_labels jsonb;

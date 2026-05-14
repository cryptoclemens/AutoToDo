-- Ideenspeicher: unstrukturierte Ideen je Projekt ohne Umsetzungsdruck
CREATE TABLE IF NOT EXISTS idea_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  note             TEXT,
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE idea_items ENABLE ROW LEVEL SECURITY;

-- Workspace-Mitglieder dürfen alles lesen und schreiben
CREATE POLICY "idea_items_workspace_access" ON idea_items
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_idea_items_project_id ON idea_items(project_id);
CREATE INDEX IF NOT EXISTS idx_idea_items_workspace_id ON idea_items(workspace_id);

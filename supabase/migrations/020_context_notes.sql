-- project_context_notes: general context extracted from transcripts
-- (availability, decisions, risks, info — not actionable tasks)

CREATE TABLE IF NOT EXISTS project_context_notes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  transcript_id     UUID REFERENCES transcripts(id) ON DELETE SET NULL,
  text              TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'info',  -- availability | decision | risk | info
  relevant_from     DATE,
  relevant_until    DATE,
  archived_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_context_notes_project ON project_context_notes(project_id);
CREATE INDEX idx_context_notes_workspace ON project_context_notes(workspace_id);

-- RLS
ALTER TABLE project_context_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "context_notes_read" ON project_context_notes
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "context_notes_write" ON project_context_notes
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Migration 045: Kalender-Verknüpfung für Transkripte (Diarisierung/Namensmatching Phase 1)
-- Verknüpft ein Transkript mit einem Meeting + Teilnehmerliste (aus .ics/OAuth/manuell).
-- Die Teilnehmer bilden die Kandidatenmenge fürs Sprecher-Namensmatching.

CREATE TABLE IF NOT EXISTS meeting_calendar_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID REFERENCES transcripts(id) ON DELETE CASCADE,
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL CHECK (provider IN ('apple','google','microsoft','ics','manual')),
  event_id      TEXT,
  title         TEXT,
  starts_at     TIMESTAMPTZ,
  ends_at       TIMESTAMPTZ,
  attendees     JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{name, email, user_id?}]
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  -- ein Transkript hat höchstens eine aktive Kalender-Verknüpfung
  UNIQUE (transcript_id)
);

CREATE INDEX IF NOT EXISTS idx_mcl_transcript ON meeting_calendar_links (transcript_id);
CREATE INDEX IF NOT EXISTS idx_mcl_workspace  ON meeting_calendar_links (workspace_id);

-- RLS: Lesen für Workspace-Mitglieder; Schreiben erfolgt über Service-Role (API prüft Projektzugriff)
ALTER TABLE meeting_calendar_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mcl_select" ON meeting_calendar_links
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

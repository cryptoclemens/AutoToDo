-- Migration 047: Diarisierungs-Segmente je Transkript (Phase 2, Teil B)
ALTER TABLE transcripts
  ADD COLUMN IF NOT EXISTS diarization JSONB DEFAULT NULL;

COMMENT ON COLUMN transcripts.diarization IS
  'Sprecher-Segmente aus On-Device-Diarisierung: [{start,end,speaker_cluster,text}].';

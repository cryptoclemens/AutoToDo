-- Migration 039: Add speaker_map column to transcripts
-- Stores the LLM-generated mapping of speaker labels to workspace members

ALTER TABLE transcripts
  ADD COLUMN IF NOT EXISTS speaker_map JSONB DEFAULT NULL;

COMMENT ON COLUMN transcripts.speaker_map IS
  'JSONB array of speaker-to-member mappings produced by LLM. Each entry: { speaker_label: string, matched_member: string|null, confidence: "high"|"medium"|"low" }';

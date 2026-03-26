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

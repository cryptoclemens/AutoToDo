-- Migration 026: Co-Verantwortliche für LOP-Punkte
-- Speichert mehrere Co-Verantwortliche als JSONB-Array: [{name, user_id}]

ALTER TABLE lop_items
  ADD COLUMN IF NOT EXISTS co_responsibles JSONB NOT NULL DEFAULT '[]'::jsonb;

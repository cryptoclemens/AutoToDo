-- Migration 048: Voiceprints (Phase 3, Slice A)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS member_voiceprints (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL,
  embedding    vector NOT NULL,
  sample_count INT NOT NULL DEFAULT 1,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);
ALTER TABLE member_voiceprints ENABLE ROW LEVEL SECURITY;  -- nur Service-Role

ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS cluster_embeddings JSONB DEFAULT NULL;

-- Bestes Match je Workspace (Brute-Force-Cosine). p_embedding als text -> ::vector
-- (robust ueber supabase-js rpc). similarity = 1 - Cosine-Distanz.
CREATE OR REPLACE FUNCTION match_voiceprint(p_workspace UUID, p_embedding TEXT)
RETURNS TABLE(user_id UUID, similarity DOUBLE PRECISION)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT mv.user_id, 1 - (mv.embedding <=> p_embedding::vector) AS similarity
  FROM member_voiceprints mv
  WHERE mv.workspace_id = p_workspace
  ORDER BY mv.embedding <=> p_embedding::vector
  LIMIT 1;
$$;

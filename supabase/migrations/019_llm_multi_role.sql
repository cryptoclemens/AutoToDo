-- Migration 019: Multi-role LLM config (extraction + transcription)
-- Adds a `role` column so workspaces can configure separate providers
-- for text extraction (Anthropic, OpenAI, …) and audio transcription (OpenAI, Groq).

-- 1. Add role column with default 'extraction' (preserves all existing rows)
ALTER TABLE workspace_llm_config
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'extraction'
    CHECK (role IN ('extraction', 'transcription'));

-- 2. Add Groq to allowed providers
ALTER TABLE workspace_llm_config
  DROP CONSTRAINT IF EXISTS workspace_llm_config_provider_check;

ALTER TABLE workspace_llm_config
  ADD CONSTRAINT workspace_llm_config_provider_check
    CHECK (provider IN ('anthropic','openai','azure_openai','google','mistral','perplexity','groq'));

-- 3. Drop old single-column PK / unique, replace with composite
ALTER TABLE workspace_llm_config DROP CONSTRAINT IF EXISTS workspace_llm_config_pkey;

ALTER TABLE workspace_llm_config
  ADD CONSTRAINT workspace_llm_config_pkey PRIMARY KEY (workspace_id, role);

-- 4. Update RLS policies (if any) – table uses service-role client so RLS is not critical,
--    but add a permissive workspace-owner policy for good hygiene.
DROP POLICY IF EXISTS "llm_config_workspace_admin" ON workspace_llm_config;

CREATE POLICY "llm_config_workspace_admin" ON workspace_llm_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_llm_config.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('workspace_owner', 'workspace_admin')
    )
  );

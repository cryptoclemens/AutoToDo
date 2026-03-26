-- Add endpoint column for Azure OpenAI / custom LLM providers
ALTER TABLE workspace_llm_config
  ADD COLUMN IF NOT EXISTS endpoint TEXT;

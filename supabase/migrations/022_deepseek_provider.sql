-- Add deepseek to allowed LLM providers
ALTER TABLE workspace_llm_config DROP CONSTRAINT IF EXISTS workspace_llm_config_provider_check;
ALTER TABLE workspace_llm_config ADD CONSTRAINT workspace_llm_config_provider_check
  CHECK (provider IN ('anthropic','openai','azure_openai','google','mistral','perplexity','groq','deepseek'));

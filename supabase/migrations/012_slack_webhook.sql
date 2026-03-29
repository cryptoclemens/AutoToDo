-- Migration 012: Slack / Teams webhook URL per workspace
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS slack_webhook_url TEXT;

-- Migration 013: Fix workspaces.plan check constraint
-- Migration 011 used ADD COLUMN IF NOT EXISTS, which silently skips if the column
-- already exists — leaving the original constraint from 001 ('free','pro','enterprise').
-- This migration drops the old constraint and adds the correct one, and ensures
-- all columns from migration 011 actually exist (idempotent).

-- Ensure migration 011 columns exist (in case ADD COLUMN IF NOT EXISTS was skipped)
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS plan_seats        INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plan_expires_at   TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Drop old check constraint and replace with the correct one
ALTER TABLE workspaces
  DROP CONSTRAINT IF EXISTS workspaces_plan_check;

ALTER TABLE workspaces
  ADD CONSTRAINT workspaces_plan_check
    CHECK (plan IN ('beta', 'free', 'solo', 'team', 'business'));

-- Migrate any legacy plan values to the nearest equivalent
UPDATE workspaces SET plan = 'free'     WHERE plan = 'pro';
UPDATE workspaces SET plan = 'business' WHERE plan = 'enterprise';

-- Ensure clemens.pompey@vencly.com workspaces are on beta
-- (plan_expires_at was set to 2099 as interim fix; this sets it properly)
UPDATE workspaces
SET plan = 'beta', plan_expires_at = NULL
WHERE id IN (
  '37f60920-d2b7-4add-87ed-eac662416835',
  '90bf0181-4edd-4882-9ebe-aac2abf4f07c'
);

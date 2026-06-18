-- Migration 039: Recurring Reminders for LOP items

CREATE TABLE recurring_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lop_item_id UUID REFERENCES lop_items(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','biweekly','monthly')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Montag, ..., 6=Sonntag (nur weekly/biweekly)
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31), -- nur monthly
  next_reminder_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE recurring_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_reminders_select" ON recurring_reminders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "recurring_reminders_insert" ON recurring_reminders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "recurring_reminders_update" ON recurring_reminders
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "recurring_reminders_delete" ON recurring_reminders
  FOR DELETE USING (user_id = auth.uid());

-- Index für Cron-Job
CREATE INDEX idx_recurring_reminders_next_at ON recurring_reminders (next_reminder_at);
CREATE INDEX idx_recurring_reminders_lop_item ON recurring_reminders (lop_item_id);

-- Migration 028: Tagesplanung pro Projekt (nicht workspace-weit)
-- Fügt project_id zu daily_plans hinzu und passt den UNIQUE-Constraint an.

ALTER TABLE daily_plans
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- Alte Zeilen ohne project_id entfernen (noch keine Produktionsdaten)
DELETE FROM daily_plans WHERE project_id IS NULL;

ALTER TABLE daily_plans
  ALTER COLUMN project_id SET NOT NULL;

ALTER TABLE daily_plans
  DROP CONSTRAINT IF EXISTS daily_plans_user_id_workspace_id_date_key;

ALTER TABLE daily_plans
  ADD CONSTRAINT daily_plans_user_project_date_key
  UNIQUE (user_id, project_id, date);

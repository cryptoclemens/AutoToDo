-- Projekteinstellungen: Sprache der Calls und Tätigkeitsnachweis-Flag
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS call_language TEXT NOT NULL DEFAULT 'de'
    CHECK (call_language IN ('de','en','fr','es','it','pt','nl','pl')),
  ADD COLUMN IF NOT EXISTS needs_activity_report BOOLEAN NOT NULL DEFAULT false;

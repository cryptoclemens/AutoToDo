-- Migration 044: Aktualitätsprüfung des Kontext-Bereichs (F-23)
-- Ein "zuletzt als aktuell bestätigt"-Zeitstempel pro Projekt. NULL = noch nie geprüft.
-- Veraltete Einzelnotizen werden bereits automatisch archiviert (context-notes GET);
-- dieser Zeitstempel macht zusätzlich sichtbar, wann der Bereich zuletzt durchgesehen wurde.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS context_reviewed_at TIMESTAMPTZ;

-- completed_at: exakter Zeitpunkt der Statusänderung auf "abgeschlossen"
ALTER TABLE lop_items ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Backfill: bestehende abgeschlossene Punkte erhalten updated_at als Schätzwert
UPDATE lop_items SET completed_at = updated_at WHERE status = 'abgeschlossen' AND completed_at IS NULL;

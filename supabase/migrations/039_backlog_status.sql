-- ===================================================
-- Migration 039: Add 'backlog' status to lop_items
-- F-027: Langzeit-Backlog für Aufgaben ohne konkrete Deadline
-- ===================================================

ALTER TABLE lop_items DROP CONSTRAINT IF EXISTS lop_items_status_check;
ALTER TABLE lop_items ADD CONSTRAINT lop_items_status_check
  CHECK (status IN ('offen', 'in_bearbeitung', 'abgeschlossen', 'geparkt', 'backlog'));

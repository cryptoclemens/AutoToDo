-- ===================================================
-- Migration 034: Add 'geparkt' status to lop_items
-- ===================================================

-- Drop the existing CHECK constraint and add the new one with 'geparkt'
ALTER TABLE lop_items DROP CONSTRAINT IF EXISTS lop_items_status_check;
ALTER TABLE lop_items ADD CONSTRAINT lop_items_status_check
  CHECK (status IN ('offen', 'in_bearbeitung', 'abgeschlossen', 'geparkt'));

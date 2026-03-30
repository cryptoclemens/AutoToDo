-- Add updated_by column to lop_items
ALTER TABLE lop_items ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

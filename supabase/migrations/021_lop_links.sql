-- Add external links to lop_items
-- Each link: { url: text, label?: text }

ALTER TABLE lop_items
  ADD COLUMN IF NOT EXISTS links JSONB NOT NULL DEFAULT '[]'::jsonb;

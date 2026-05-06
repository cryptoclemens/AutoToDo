-- Support generic invite links (no email required, reusable)
ALTER TABLE invitations ALTER COLUMN email DROP NOT NULL;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS is_link boolean NOT NULL DEFAULT false;

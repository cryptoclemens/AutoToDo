-- Migration 016: Projekt-Level-Branding
-- Adds optional branding columns to projects table.
-- When branding_inherited = true (default), the workspace branding is used.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS brand_color   TEXT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS logo_url      TEXT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS branding_inherited BOOLEAN DEFAULT true NOT NULL;

COMMENT ON COLUMN projects.brand_color        IS 'Optional hex color override (e.g. #2563EB). NULL = inherit from workspace.';
COMMENT ON COLUMN projects.logo_url           IS 'Optional logo URL override. NULL = inherit from workspace.';
COMMENT ON COLUMN projects.branding_inherited IS 'When true, workspace branding is used as fallback. Set to false when project has explicit branding.';

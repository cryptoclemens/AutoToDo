-- Migration 043: LOP-Punkte verschmelzen, aufteilen und verknüpfen
-- F-29 (Verschmelzen von Duplikaten) + F-21 (Verknüpfen verwandter Punkte / Aufteilen großer Pakete)

-- ── 1. Hierarchie (Aufteilen) + Merge-Verweis (Verschmelzen) ────────────────
-- parent_id: Teilaufgaben verweisen auf ihren Sammel-/Eltern-Punkt (F-21b Aufteilen)
-- merged_into_id: verschmolzene Quell-Punkte verweisen auf den Ziel-Punkt (F-29)
ALTER TABLE lop_items
  ADD COLUMN IF NOT EXISTS parent_id      UUID REFERENCES lop_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS merged_into_id UUID REFERENCES lop_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lop_items_parent      ON lop_items (parent_id);
CREATE INDEX IF NOT EXISTS idx_lop_items_merged_into ON lop_items (merged_into_id);

-- Neuer Status 'merged' für archivierte Quell-Punkte (reversibel, bleiben für Audit erhalten)
ALTER TABLE lop_items DROP CONSTRAINT IF EXISTS lop_items_status_check;
ALTER TABLE lop_items ADD CONSTRAINT lop_items_status_check
  CHECK (status IN ('offen', 'in_bearbeitung', 'abgeschlossen', 'geparkt', 'backlog', 'merged'));

-- ── 2. Verknüpfungen verwandter Punkte (F-21a) ──────────────────────────────
-- Symmetrische "verwandt mit"-Beziehung. Kanonische Speicherung: item_a < item_b
-- (per CHECK erzwungen), damit ein Paar nur einmal existiert. Abfrage bidirektional via OR.
CREATE TABLE IF NOT EXISTS lop_item_relations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  item_a       UUID NOT NULL REFERENCES lop_items(id) ON DELETE CASCADE,
  item_b       UUID NOT NULL REFERENCES lop_items(id) ON DELETE CASCADE,
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT lop_relation_ordered CHECK (item_a < item_b),
  CONSTRAINT lop_relation_unique   UNIQUE (item_a, item_b)
);

CREATE INDEX IF NOT EXISTS idx_lop_relations_a ON lop_item_relations (item_a);
CREATE INDEX IF NOT EXISTS idx_lop_relations_b ON lop_item_relations (item_b);

-- RLS analog zu lop_items: Zugriff über Workspace-Mitgliedschaft
ALTER TABLE lop_item_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lop_relations_select" ON lop_item_relations
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "lop_relations_insert" ON lop_item_relations
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "lop_relations_delete" ON lop_item_relations
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

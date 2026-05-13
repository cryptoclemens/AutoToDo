-- Migration 031: Backfill responsible_user_id für bestehende LOP-Items
--
-- Hintergrund: processTranscript.ts hat responsible_user_id nie gesetzt,
-- weil die profiles-Join-Abfrage kaputt war. Dieser Backfill löst den
-- responsible-Text (Vor- oder Vollname, case-insensitiv) gegen die
-- Workspace-Mitglieder auf und trägt die UUID nach.
--
-- Matching-Reihenfolge:
--   1. Vollname exakt (case-insensitiv)
--   2. Vorname (erstes Wort des display_name, case-insensitiv)
--
-- Bei Mehrdeutigkeit (zwei Mitglieder mit gleichem Vornamen) wird kein
-- Eintrag gesetzt (DISTINCT ON bevorzugt den Vollname-Treffer).

UPDATE lop_items li
SET responsible_user_id = match.user_id
FROM (
  SELECT DISTINCT ON (li2.id)
    li2.id AS lop_item_id,
    wm.user_id,
    -- Vollname-Treffer = höhere Priorität (1), Vorname-Treffer = 2
    CASE
      WHEN lower(li2.responsible) = lower(
        COALESCE(
          NULLIF(u.raw_user_meta_data->>'full_name', ''),
          NULLIF(u.raw_user_meta_data->>'name', ''),
          u.email
        )
      ) THEN 1
      ELSE 2
    END AS match_priority
  FROM lop_items li2
  JOIN workspace_members wm ON wm.workspace_id = li2.workspace_id
  JOIN auth.users u ON u.id = wm.user_id
  WHERE li2.responsible_user_id IS NULL
    AND li2.responsible IS NOT NULL
    AND (
      -- Vollname-Treffer
      lower(li2.responsible) = lower(
        COALESCE(
          NULLIF(u.raw_user_meta_data->>'full_name', ''),
          NULLIF(u.raw_user_meta_data->>'name', ''),
          u.email
        )
      )
      OR
      -- Vorname-Treffer (erstes Wort des display_name)
      lower(li2.responsible) = lower(
        SPLIT_PART(
          COALESCE(
            NULLIF(u.raw_user_meta_data->>'full_name', ''),
            NULLIF(u.raw_user_meta_data->>'name', ''),
            u.email
          ),
          ' ', 1
        )
      )
    )
  ORDER BY li2.id, match_priority
) match
WHERE li.id = match.lop_item_id;

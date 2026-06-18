-- B-010: Backfill – alle Varianten von Markus Wanzek → "Markus"
-- Hintergrund: Neue Transkripte schreiben weiterhin "Markus Wanzek I Plenum"
-- weil der Wert noch in lop_items.responsible stand und als bekannter Name
-- an den LLM-Prompt weitergegeben wurde.

-- 1. Primärfeld responsible bereinigen
UPDATE lop_items
SET responsible = 'Markus'
WHERE responsible ILIKE '%markus wanzek%'
   OR responsible ILIKE '%markus wanzek i plenum%'
   OR responsible = 'Markus Wanzek';

-- 2. co_responsibles (JSONB-Array) bereinigen
UPDATE lop_items
SET co_responsibles = (
  SELECT jsonb_agg(
    CASE WHEN val ILIKE '%markus wanzek%' THEN '"Markus"'::jsonb ELSE val::jsonb END
  )
  FROM jsonb_array_elements_text(co_responsibles) AS val
)
WHERE co_responsibles IS NOT NULL
  AND co_responsibles::text ILIKE '%markus wanzek%';

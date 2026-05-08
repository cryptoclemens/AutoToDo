-- Fortlaufende Kategorie-Sequenz für Feedback-IDs (F-001, B-001, G-001)

ALTER TABLE feedback ADD COLUMN IF NOT EXISTS category_seq INTEGER;

-- Backfill bestehender Einträge (chronologisch, pro Kategorie)
UPDATE feedback f
SET category_seq = sub.rn
FROM (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY CASE category
        WHEN 'feature' THEN 'feature'
        WHEN 'bug'     THEN 'bug'
        ELSE 'general'
      END
      ORDER BY created_at
    ) AS rn
  FROM feedback
) sub
WHERE f.id = sub.id;

-- Trigger: weist neuen Einträgen automatisch die nächste Seq-Nummer zu
CREATE OR REPLACE FUNCTION assign_feedback_seq()
RETURNS TRIGGER AS $$
DECLARE
  cat TEXT;
BEGIN
  cat := CASE NEW.category
    WHEN 'feature' THEN 'feature'
    WHEN 'bug'     THEN 'bug'
    ELSE 'general'
  END;
  SELECT COALESCE(MAX(category_seq), 0) + 1
  INTO NEW.category_seq
  FROM feedback
  WHERE CASE category
    WHEN 'feature' THEN 'feature'
    WHEN 'bug'     THEN 'bug'
    ELSE 'general'
  END = cat;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_seq_trigger
BEFORE INSERT ON feedback
FOR EACH ROW EXECUTE FUNCTION assign_feedback_seq();

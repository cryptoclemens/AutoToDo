-- ===================================================
-- AutoToDo – Migration 022: Feedback-Status
-- ===================================================

ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'in_review', 'done', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

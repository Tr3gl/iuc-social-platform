-- ============================================================================
-- MIGRATION: Create pending_tags table for custom tag submissions
-- ============================================================================

-- Create pending_tags table
CREATE TABLE IF NOT EXISTS pending_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  suggested_type TEXT NOT NULL CHECK (suggested_type IN ('positive', 'negative')),
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE pending_tags ENABLE ROW LEVEL SECURITY;

-- Policies for pending_tags
CREATE POLICY "Users can submit tags"
  ON pending_tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can view own submissions"
  ON pending_tags FOR SELECT
  TO authenticated
  USING (auth.uid() = submitted_by);

-- Admin policy (you'll need to set up admin role separately)
-- For now, we'll use a simple approach: admins are users with email ending in @admin or specific emails
CREATE POLICY "Admins can view all pending tags"
  ON pending_tags FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' LIKE '%@admin.iuc.edu.tr'
    OR auth.jwt() ->> 'email' IN (
      'admin@example.com' -- Replace with actual admin emails
    )
  );

CREATE POLICY "Admins can update pending tags"
  ON pending_tags FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' LIKE '%@admin.iuc.edu.tr'
    OR auth.jwt() ->> 'email' IN (
      'admin@example.com' -- Replace with actual admin emails
    )
  );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_pending_tags_status ON pending_tags(status);
CREATE INDEX IF NOT EXISTS idx_pending_tags_submitted_by ON pending_tags(submitted_by);

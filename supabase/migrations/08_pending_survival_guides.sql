-- ============================================================================
-- MIGRATION: Add pending_survival_guides table for moderation
-- ============================================================================

-- Create pending_survival_guides table
CREATE TABLE IF NOT EXISTS pending_survival_guides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  survival_guide TEXT NOT NULL,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pending_survival_guides ENABLE ROW LEVEL SECURITY;

-- Policy: Users can submit survival guides
CREATE POLICY "Users can submit survival guides" ON pending_survival_guides
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = submitted_by);

-- Policy: Users can view their own submissions
CREATE POLICY "Users can view own survival guide submissions" ON pending_survival_guides
  FOR SELECT TO authenticated
  USING (auth.uid() = submitted_by);

-- Policy: Admins can view all pending survival guides
CREATE POLICY "Admins can view all pending survival guides" ON pending_survival_guides
  FOR SELECT TO authenticated
  USING (true);

-- Policy: Admins can update pending survival guides
CREATE POLICY "Admins can update pending survival guides" ON pending_survival_guides
  FOR UPDATE TO authenticated
  USING (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_pending_survival_guides_status ON pending_survival_guides(status);
CREATE INDEX IF NOT EXISTS idx_pending_survival_guides_course ON pending_survival_guides(course_id);

-- ============================================================================
-- Update reviews table: survival_guide should reference approved guides only
-- ============================================================================

-- Add pending_guide_id to reviews (optional, to link to pending guide)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS pending_survival_guide_id UUID REFERENCES pending_survival_guides(id);

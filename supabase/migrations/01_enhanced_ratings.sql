-- ============================================================================
-- MIGRATION: Enhanced Ratings, Tags, and Trust System
-- ============================================================================

-- 1. Add new Likert scale metrics to 'reviews' table
ALTER TABLE reviews
ADD COLUMN grading_fairness INTEGER CHECK (grading_fairness >= 1 AND grading_fairness <= 5),
ADD COLUMN attendance INTEGER CHECK (attendance >= 1 AND attendance <= 5),
ADD COLUMN material_relevance INTEGER CHECK (material_relevance >= 1 AND material_relevance <= 5),
ADD COLUMN exam_predictability INTEGER CHECK (exam_predictability >= 1 AND exam_predictability <= 5),
ADD COLUMN survival_guide TEXT CHECK (LENGTH(survival_guide) <= 280);

-- 2. Create 'tags' table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('positive', 'negative')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view verified tags
CREATE POLICY "Everyone can view verified tags" 
    ON tags FOR SELECT 
    USING (is_verified = true OR (auth.uid() = created_by));

-- Policy: Authenticated users can create tags
CREATE POLICY "Authenticated users can create tags" 
    ON tags FOR INSERT 
    WITH CHECK (auth.uid() = created_by);

-- 3. Create 'review_tags' junction table
CREATE TABLE review_tags (
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (review_id, tag_id)
);

ALTER TABLE review_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view review tags" 
    ON review_tags FOR SELECT 
    USING (true);

CREATE POLICY "Users tag their own reviews" 
    ON review_tags FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM reviews 
            WHERE id = review_id AND user_id = auth.uid()
        )
    );

-- 4. Create 'review_votes' table (Trust System)
CREATE TABLE review_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'missing_parts', 'totally_wrong', 'rage_bait')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view votes" 
    ON review_votes FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can vote" 
    ON review_votes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vote" 
    ON review_votes FOR DELETE 
    USING (auth.uid() = user_id);

-- 5. Seed some initial verified tags
INSERT INTO tags (name, type, is_verified) VALUES
('High Grades', 'positive', true),
('Helpful Prof', 'positive', true),
('Clear Slides', 'positive', true),
('No Final', 'positive', true),
('Interactive', 'positive', true),
('Heavy HW', 'negative', true),
('Exam Focus', 'negative', true),
('Strict Curve', 'negative', true),
('Outdated Books', 'negative', true),
('Long Lectures', 'negative', true);

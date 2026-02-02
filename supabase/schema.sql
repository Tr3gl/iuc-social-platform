-- Anonymous University Course Feedback Platform
-- Database Schema with Row Level Security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Faculties/Departments
CREATE TABLE faculties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(faculty_id, code)
);

-- Instructors
CREATE TABLE instructors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course-Instructor relationship (many-to-many)
CREATE TABLE course_instructors (
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (course_id, instructor_id)
);

-- Reviews (CRITICAL: No email fields, only user_id from auth.users)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
    
    -- Structured ratings (1-5 scale)
    difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
    usefulness INTEGER NOT NULL CHECK (usefulness >= 1 AND usefulness <= 5),
    workload INTEGER NOT NULL CHECK (workload >= 1 AND workload <= 5),
    exam_clarity INTEGER NOT NULL CHECK (exam_clarity >= 1 AND exam_clarity <= 5),
    
    -- Categorical questions
    difficulty_value_alignment TEXT NOT NULL CHECK (
        difficulty_value_alignment IN ('well_balanced', 'too_difficult', 'too_easy')
    ),
    exam_format TEXT NOT NULL CHECK (
        exam_format IN ('written', 'oral', 'project', 'mixed')
    ),
    
    -- Optional text comment
    comment TEXT CHECK (LENGTH(comment) <= 300),
    
    -- Report functionality
    report_count INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Enforce one review per user per course
    UNIQUE(user_id, course_id)
);

-- Files (course materials, exams)
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL CHECK (type IN ('exam', 'notes', 'other')),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    
    -- Report functionality
    report_count INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review reports (track who reported what)
CREATE TABLE review_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, reporter_id)
);

-- File reports
CREATE TABLE file_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(file_id, reporter_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_courses_faculty ON courses(faculty_id);
CREATE INDEX idx_reviews_course ON reviews(course_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_created ON reviews(created_at);
CREATE INDEX idx_files_course ON files(course_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_reports ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- FACULTIES: Public read
-- ----------------------------------------------------------------------------

CREATE POLICY "Anyone can view faculties"
    ON faculties FOR SELECT
    USING (true);

-- ----------------------------------------------------------------------------
-- COURSES: Public read
-- ----------------------------------------------------------------------------

CREATE POLICY "Anyone can view courses"
    ON courses FOR SELECT
    USING (true);

-- ----------------------------------------------------------------------------
-- INSTRUCTORS: Public read
-- ----------------------------------------------------------------------------

CREATE POLICY "Anyone can view instructors"
    ON instructors FOR SELECT
    USING (true);

-- ----------------------------------------------------------------------------
-- COURSE_INSTRUCTORS: Public read
-- ----------------------------------------------------------------------------

CREATE POLICY "Anyone can view course instructors"
    ON course_instructors FOR SELECT
    USING (true);

-- ----------------------------------------------------------------------------
-- REVIEWS: Protected anonymity
-- ----------------------------------------------------------------------------

-- Users can view reviews but NOT the user_id (handled in app layer)
CREATE POLICY "Anyone can view non-hidden reviews"
    ON reviews FOR SELECT
    USING (is_hidden = false);

-- Users can insert reviews with their own user_id
CREATE POLICY "Authenticated users can create reviews"
    ON reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
    ON reviews FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
    ON reviews FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- FILES: Protected uploads
-- ----------------------------------------------------------------------------

-- Anyone can view non-hidden files
CREATE POLICY "Anyone can view non-hidden files"
    ON files FOR SELECT
    USING (is_hidden = false);

-- Authenticated users can upload files
CREATE POLICY "Authenticated users can upload files"
    ON files FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own files
CREATE POLICY "Users can delete their own files"
    ON files FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- REPORTS: Users can report content
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view their own review reports"
    ON review_reports FOR SELECT
    USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users can report reviews"
    ON review_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own file reports"
    ON file_reports FOR SELECT
    USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users can report files"
    ON file_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- ============================================================================
-- FUNCTIONS FOR AGGREGATED STATS
-- ============================================================================

-- Function to get course statistics (anonymized)
CREATE OR REPLACE FUNCTION get_course_stats(course_uuid UUID)
RETURNS TABLE(
    total_reviews BIGINT,
    median_difficulty NUMERIC,
    median_usefulness NUMERIC,
    median_workload NUMERIC,
    median_exam_clarity NUMERIC,
    difficulty_distribution JSONB,
    usefulness_distribution JSONB,
    workload_distribution JSONB,
    exam_clarity_distribution JSONB,
    difficulty_value_counts JSONB,
    exam_format_counts JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_reviews,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY difficulty) as median_difficulty,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY usefulness) as median_usefulness,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY workload) as median_workload,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY exam_clarity) as median_exam_clarity,
        jsonb_object_agg(COALESCE(diff_rating::TEXT, 'null'), diff_count) as difficulty_distribution,
        jsonb_object_agg(COALESCE(use_rating::TEXT, 'null'), use_count) as usefulness_distribution,
        jsonb_object_agg(COALESCE(work_rating::TEXT, 'null'), work_count) as workload_distribution,
        jsonb_object_agg(COALESCE(exam_rating::TEXT, 'null'), exam_count) as exam_clarity_distribution,
        jsonb_object_agg(COALESCE(dva, 'null'), dva_count) as difficulty_value_counts,
        jsonb_object_agg(COALESCE(ef, 'null'), ef_count) as exam_format_counts
    FROM (
        SELECT course_id FROM reviews WHERE course_id = course_uuid LIMIT 1
    ) base
    LEFT JOIN LATERAL (
        SELECT difficulty as diff_rating, COUNT(*) as diff_count
        FROM reviews WHERE course_id = course_uuid AND is_hidden = false
        GROUP BY difficulty
    ) diff ON true
    LEFT JOIN LATERAL (
        SELECT usefulness as use_rating, COUNT(*) as use_count
        FROM reviews WHERE course_id = course_uuid AND is_hidden = false
        GROUP BY usefulness
    ) use ON true
    LEFT JOIN LATERAL (
        SELECT workload as work_rating, COUNT(*) as work_count
        FROM reviews WHERE course_id = course_uuid AND is_hidden = false
        GROUP BY workload
    ) work ON true
    LEFT JOIN LATERAL (
        SELECT exam_clarity as exam_rating, COUNT(*) as exam_count
        FROM reviews WHERE course_id = course_uuid AND is_hidden = false
        GROUP BY exam_clarity
    ) exam ON true
    LEFT JOIN LATERAL (
        SELECT difficulty_value_alignment as dva, COUNT(*) as dva_count
        FROM reviews WHERE course_id = course_uuid AND is_hidden = false
        GROUP BY difficulty_value_alignment
    ) dva ON true
    LEFT JOIN LATERAL (
        SELECT exam_format as ef, COUNT(*) as ef_count
        FROM reviews WHERE course_id = course_uuid AND is_hidden = false
        GROUP BY exam_format
    ) ef ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update review report count when report is created
CREATE OR REPLACE FUNCTION increment_review_report_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE reviews
    SET report_count = report_count + 1
    WHERE id = NEW.review_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER review_report_increment
    AFTER INSERT ON review_reports
    FOR EACH ROW
    EXECUTE FUNCTION increment_review_report_count();

-- Update file report count when report is created
CREATE OR REPLACE FUNCTION increment_file_report_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE files
    SET report_count = report_count + 1
    WHERE id = NEW.file_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER file_report_increment
    AFTER INSERT ON file_reports
    FOR EACH ROW
    EXECUTE FUNCTION increment_file_report_count();

-- Update updated_at timestamp on review changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE reviews IS 'Anonymous course reviews. user_id is UUID only, no email exposure.';
COMMENT ON COLUMN reviews.user_id IS 'References auth.users(id). Email is stored separately in auth schema.';
COMMENT ON FUNCTION get_course_stats IS 'Returns aggregated, anonymized statistics for a course.';

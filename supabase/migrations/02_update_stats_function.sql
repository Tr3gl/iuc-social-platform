-- ============================================================================
-- MIGRATION: Update get_course_stats to include new metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_course_stats(course_uuid UUID)
RETURNS TABLE(
    total_reviews BIGINT,
    median_difficulty NUMERIC,
    median_usefulness NUMERIC,
    median_workload NUMERIC,
    median_exam_clarity NUMERIC,
    median_grading_fairness NUMERIC,
    median_attendance NUMERIC,
    median_material_relevance NUMERIC,
    median_exam_predictability NUMERIC,
    difficulty_distribution JSONB,
    usefulness_distribution JSONB,
    workload_distribution JSONB,
    exam_clarity_distribution JSONB,
    grading_fairness_distribution JSONB,
    attendance_distribution JSONB,
    material_relevance_distribution JSONB,
    exam_predictability_distribution JSONB,
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
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY COALESCE(grading_fairness, 0)) as median_grading_fairness,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY COALESCE(attendance, 0)) as median_attendance,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY COALESCE(material_relevance, 0)) as median_material_relevance,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY COALESCE(exam_predictability, 0)) as median_exam_predictability,
        
        jsonb_object_agg(COALESCE(diff_rating::TEXT, 'null'), diff_count) as difficulty_distribution,
        jsonb_object_agg(COALESCE(use_rating::TEXT, 'null'), use_count) as usefulness_distribution,
        jsonb_object_agg(COALESCE(work_rating::TEXT, 'null'), work_count) as workload_distribution,
        jsonb_object_agg(COALESCE(exam_rating::TEXT, 'null'), exam_count) as exam_clarity_distribution,
        jsonb_object_agg(COALESCE(grading_rating::TEXT, 'null'), grading_count) as grading_fairness_distribution,
        jsonb_object_agg(COALESCE(attendance_rating::TEXT, 'null'), attendance_count) as attendance_distribution,
        jsonb_object_agg(COALESCE(material_rating::TEXT, 'null'), material_count) as material_relevance_distribution,
        jsonb_object_agg(COALESCE(predict_rating::TEXT, 'null'), predict_count) as exam_predictability_distribution,
        
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
    -- New Metrics
    LEFT JOIN LATERAL (
        SELECT grading_fairness as grading_rating, COUNT(*) as grading_count
        FROM reviews WHERE course_id = course_uuid AND is_hidden = false AND grading_fairness IS NOT NULL
        GROUP BY grading_fairness
    ) grading ON true
    LEFT JOIN LATERAL (
        SELECT attendance as attendance_rating, COUNT(*) as attendance_count
        FROM reviews WHERE course_id = course_uuid AND is_hidden = false AND attendance IS NOT NULL
        GROUP BY attendance
    ) attendance ON true
    LEFT JOIN LATERAL (
        SELECT material_relevance as material_rating, COUNT(*) as material_count
        FROM reviews WHERE course_id = course_uuid AND is_hidden = false AND material_relevance IS NOT NULL
        GROUP BY material_relevance
    ) material ON true
    LEFT JOIN LATERAL (
        SELECT exam_predictability as predict_rating, COUNT(*) as predict_count
        FROM reviews WHERE course_id = course_uuid AND is_hidden = false AND exam_predictability IS NOT NULL
        GROUP BY exam_predictability
    ) predict ON true
    
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

-- ============================================================================
-- MIGRATION: Fix get_course_stats for English Refactor (CORRECTED)
-- ============================================================================

DROP FUNCTION IF EXISTS get_course_stats(uuid) CASCADE;

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
DECLARE
    -- Variables for Aggregates
    r_total BIGINT;
    r_med_diff NUMERIC;
    r_med_use NUMERIC;
    r_med_work NUMERIC;
    r_med_exam NUMERIC;
    r_med_grading NUMERIC;
    r_med_att NUMERIC;
    r_med_mat NUMERIC;
    r_med_pred NUMERIC;
    
    -- Variables for Distributions
    r_diff_dist JSONB;
    r_use_dist JSONB;
    r_work_dist JSONB;
    r_exam_dist JSONB;
    r_grading_dist JSONB;
    r_att_dist JSONB;
    r_mat_dist JSONB;
    r_pred_dist JSONB;
    r_dva_counts JSONB;
    r_ef_counts JSONB; -- This will now store midterm_format counts
BEGIN
    -- 1. Aggregates (Count & Medians)
    SELECT
        COUNT(*),
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY difficulty),
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY usefulness),
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY workload),
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY exam_clarity),
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY grading_fairness),
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY attendance),
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY material_relevance),
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY exam_predictability)
    INTO
        r_total, r_med_diff, r_med_use, r_med_work, r_med_exam, 
        r_med_grading, r_med_att, r_med_mat, r_med_pred
    FROM reviews
    WHERE course_id = course_uuid AND is_hidden = false;

    -- Return 0/Nulls if no reviews
    IF r_total = 0 OR r_total IS NULL THEN
        RETURN QUERY SELECT
            0::BIGINT, 
            NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC,
            NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC,
            '{}'::JSONB, '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
            '{}'::JSONB, '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
            '{}'::JSONB, '{}'::JSONB;
        RETURN;
    END IF;

    -- 2. Distributions
    SELECT jsonb_object_agg(difficulty, c) INTO r_diff_dist FROM (SELECT difficulty, COUNT(*) as c FROM reviews WHERE course_id = course_uuid AND is_hidden = false GROUP BY difficulty) t;
    SELECT jsonb_object_agg(usefulness, c) INTO r_use_dist FROM (SELECT usefulness, COUNT(*) as c FROM reviews WHERE course_id = course_uuid AND is_hidden = false GROUP BY usefulness) t;
    SELECT jsonb_object_agg(workload, c) INTO r_work_dist FROM (SELECT workload, COUNT(*) as c FROM reviews WHERE course_id = course_uuid AND is_hidden = false GROUP BY workload) t;
    SELECT jsonb_object_agg(exam_clarity, c) INTO r_exam_dist FROM (SELECT exam_clarity, COUNT(*) as c FROM reviews WHERE course_id = course_uuid AND is_hidden = false GROUP BY exam_clarity) t;
    
    SELECT jsonb_object_agg(grading_fairness, c) INTO r_grading_dist FROM (SELECT grading_fairness, COUNT(*) as c FROM reviews WHERE course_id = course_uuid AND is_hidden = false AND grading_fairness IS NOT NULL GROUP BY grading_fairness) t;
    SELECT jsonb_object_agg(attendance, c) INTO r_att_dist FROM (SELECT attendance, COUNT(*) as c FROM reviews WHERE course_id = course_uuid AND is_hidden = false AND attendance IS NOT NULL GROUP BY attendance) t;
    SELECT jsonb_object_agg(material_relevance, c) INTO r_mat_dist FROM (SELECT material_relevance, COUNT(*) as c FROM reviews WHERE course_id = course_uuid AND is_hidden = false AND material_relevance IS NOT NULL GROUP BY material_relevance) t;
    SELECT jsonb_object_agg(exam_predictability, c) INTO r_pred_dist FROM (SELECT exam_predictability, COUNT(*) as c FROM reviews WHERE course_id = course_uuid AND is_hidden = false AND exam_predictability IS NOT NULL GROUP BY exam_predictability) t;

    SELECT jsonb_object_agg(difficulty_value_alignment, c) INTO r_dva_counts FROM (SELECT difficulty_value_alignment, COUNT(*) as c FROM reviews WHERE course_id = course_uuid AND is_hidden = false AND difficulty_value_alignment IS NOT NULL GROUP BY difficulty_value_alignment) t;
    
    -- CORRECTED: Use midterm_format for "exam_format_counts" output until frontend is updated or to map to it
    SELECT jsonb_object_agg(midterm_format, c) INTO r_ef_counts FROM (SELECT midterm_format, COUNT(*) as c FROM reviews WHERE course_id = course_uuid AND is_hidden = false AND midterm_format IS NOT NULL GROUP BY midterm_format) t;

    -- 3. Return aggregated row
    RETURN QUERY SELECT
        r_total,
        r_med_diff, r_med_use, r_med_work, r_med_exam,
        r_med_grading, r_med_att, r_med_mat, r_med_pred,
        COALESCE(r_diff_dist, '{}'::JSONB),
        COALESCE(r_use_dist, '{}'::JSONB),
        COALESCE(r_work_dist, '{}'::JSONB),
        COALESCE(r_exam_dist, '{}'::JSONB),
        COALESCE(r_grading_dist, '{}'::JSONB),
        COALESCE(r_att_dist, '{}'::JSONB),
        COALESCE(r_mat_dist, '{}'::JSONB),
        COALESCE(r_pred_dist, '{}'::JSONB),
        COALESCE(r_dva_counts, '{}'::JSONB),
        COALESCE(r_ef_counts, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

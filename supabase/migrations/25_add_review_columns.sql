-- Migration: Add missing columns to reviews table for new review system
-- Run this in Supabase SQL Editor

-- Add new columns
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS extra_assessments text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS grading_fairness integer,
ADD COLUMN IF NOT EXISTS material_relevance integer,
ADD COLUMN IF NOT EXISTS exam_predictability integer,
ADD COLUMN IF NOT EXISTS midterm_format text,
ADD COLUMN IF NOT EXISTS final_format text,
ADD COLUMN IF NOT EXISTS survival_guide text;

-- Make exam_clarity optional (it's being removed from the UI)
ALTER TABLE reviews ALTER COLUMN exam_clarity SET DEFAULT 3;
ALTER TABLE reviews ALTER COLUMN exam_clarity DROP NOT NULL;

-- Update attendance: keep as integer, but now 1=Yes, 0=No
-- Existing 1-5 values will be treated as: >=3 = Yes, <3 = No when displayed

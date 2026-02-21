// Minimum reviews required before displaying statistics
export const MIN_REVIEWS_FOR_DISPLAY = 10;

// Maximum comment length
export const MAX_COMMENT_LENGTH = 300;

// Rating scale
export const MIN_RATING = 1;
export const MAX_RATING = 5;

// File upload limits
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (Supabase free tier limit)
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/png',
];

// Rate limiting (client-side suggestion)
export const REVIEW_COOLDOWN_HOURS = 24;

// Supabase storage bucket name
export const STORAGE_BUCKET = 'course-files';

// Difficulty value alignment options
// Difficulty value alignment options
export const DIFFICULTY_VALUE_ALIGNMENT = {
  well_balanced: 'well_balanced',
  too_difficult: 'too_difficult',
  too_easy: 'too_easy',
} as const;

// Exam format options - Vize (Midterm)
export const VIZE_FORMAT = {
  classical: 'classical',
  test: 'test',
  mix: 'mix',
} as const;

// Exam format options - Final
export const FINAL_FORMAT = {
  classical: 'classical',
  test: 'test',
  mix: 'mix',
} as const;

// Extra assessment types (optional toggles - not required)
export const EXTRA_ASSESSMENTS = {
  project: 'project',
  lab: 'lab',
  quiz: 'quiz',
  homework: 'homework',
} as const;

// Legacy - keep for backward compatibility
export const EXAM_FORMAT = VIZE_FORMAT;

// Rating labels
// Rating labels
export const RATING_LABELS = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
} as const;

export const METRIC_DESCRIPTIONS = {
  difficulty: { 1: "difficulty_1", 5: "difficulty_5" },
  grading_fairness: { 1: "grading_fairness_1", 5: "grading_fairness_5" },
  attendance: { 1: "attendance_1", 5: "attendance_5" },
  material_relevance: { 1: "material_relevance_1", 5: "material_relevance_5" },
  exam_predictability: { 1: "exam_predictability_1", 5: "exam_predictability_5" },
} as const;

// File type options
// File type options
export const FILE_TYPES = {
  notes: 'notes',
  other: 'other',
} as const;

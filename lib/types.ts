import { Database } from '../supabase/database.types';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
// Enums are not defined in the current database types
// export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Define application-specific types extending the database types

export type Review = Tables<'reviews'> & {
    instructors: { name: string; title: string | null } | null;
    review_tags?: {
        tags: Tables<'tags'> & { name_tr?: string }
    }[];
    review_votes?: {
        user_id: string;
        vote_type: 'helpful' | 'missing_parts' | 'totally_wrong' | 'rage_bait'
    }[];
};

export type File = Tables<'files'> & {
    courses?: { name: string; code: string } | null;
};

export type Course = Tables<'courses'> & {
    faculties?: { name: string; name_tr?: string } | null;
    course_instructors?: {
        instructors: { id: string; name: string; title: string | null } | null;
    }[];
    reviews?: { count: number }[];
    files?: { count: number }[];
};

export type Faculty = Tables<'faculties'> & {
    course_count?: number;
    child_count?: number;
    courses?: { count: number }[];
    parent?: { id: string, name: string, name_tr?: string } | null;
}

export type Tag = Tables<'tags'>;

export type CourseStats = {
    total_reviews: number;
    median_difficulty: number;
    median_usefulness: number;
    median_workload: number;
    difficulty_distribution: Record<string, number>;
    usefulness_distribution: Record<string, number>;
    workload_distribution: Record<string, number>;
    difficulty_value_counts: Record<string, number>;
    exam_format_counts: Record<string, number>;
    grading_fairness_distribution?: Record<string, number>;
    attendance_distribution?: Record<string, number>;
    material_relevance_distribution?: Record<string, number>;
    exam_predictability_distribution?: Record<string, number>;
};

export interface PendingSurvivalGuide {
    id: string;
    course_id: string;
    survival_guide: string;
    submitted_by: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    reviewed_at?: string | null;
    reviewed_by?: string | null;
}

export interface PendingTag {
    id: string;
    course_id: string | null;
    name: string;
    suggested_type: 'positive' | 'negative';
    submitted_by: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    reviewed_at?: string | null;
    reviewed_by?: string | null;
}

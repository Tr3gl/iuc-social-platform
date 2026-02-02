export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            faculties: {
                Row: {
                    id: string
                    name: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    created_at?: string
                }
            }
            courses: {
                Row: {
                    id: string
                    faculty_id: string
                    name: string
                    code: string
                    credit_theory: number | null
                    ects: number | null
                    term: string | null
                    semester: number | null
                    course_type: string | null
                    class_type: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    faculty_id: string
                    name: string
                    code: string
                    credit_theory?: number | null
                    ects?: number | null
                    term?: string | null
                    semester?: number | null
                    course_type?: string | null
                    class_type?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    faculty_id?: string
                    name?: string
                    code?: string
                    credit_theory?: number | null
                    ects?: number | null
                    term?: string | null
                    semester?: number | null
                    course_type?: string | null
                    class_type?: string | null
                    created_at?: string
                }
            }
            instructors: {
                Row: {
                    id: string
                    name: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    created_at?: string
                }
            }
            course_instructors: {
                Row: {
                    course_id: string
                    instructor_id: string
                    created_at: string
                }
                Insert: {
                    course_id: string
                    instructor_id: string
                    created_at?: string
                }
                Update: {
                    course_id?: string
                    instructor_id?: string
                    created_at?: string
                }
            }
            reviews: {
                Row: {
                    id: string
                    user_id: string
                    course_id: string
                    instructor_id: string | null
                    difficulty: number
                    usefulness: number
                    workload: number
                    exam_clarity: number
                    grading_fairness: number | null
                    attendance: number | null
                    material_relevance: number | null
                    exam_predictability: number | null
                    survival_guide: string | null
                    difficulty_value_alignment: string
                    midterm_format: string
                    final_format: string
                    comment: string | null
                    report_count: number
                    is_hidden: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    course_id: string
                    instructor_id?: string | null
                    difficulty: number
                    usefulness: number
                    workload: number
                    exam_clarity: number
                    grading_fairness?: number | null
                    attendance?: number | null
                    material_relevance?: number | null
                    exam_predictability?: number | null
                    survival_guide?: string | null
                    difficulty_value_alignment: string
                    midterm_format: string
                    final_format: string
                    comment?: string | null
                    report_count?: number
                    is_hidden?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    course_id?: string
                    instructor_id?: string | null
                    difficulty?: number
                    usefulness?: number
                    workload?: number
                    exam_clarity?: number
                    grading_fairness?: number | null
                    attendance?: number | null
                    material_relevance?: number | null
                    exam_predictability?: number | null
                    survival_guide?: string | null
                    difficulty_value_alignment?: string
                    midterm_format?: string
                    final_format?: string
                    comment?: string | null
                    report_count?: number
                    is_hidden?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            files: {
                Row: {
                    id: string
                    course_id: string
                    user_id: string
                    type: 'exam' | 'notes' | 'other'
                    file_name: string
                    file_path: string
                    file_url: string
                    report_count: number
                    is_hidden: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    course_id: string
                    user_id: string
                    type: 'exam' | 'notes' | 'other'
                    file_name: string
                    file_path: string
                    file_url: string
                    report_count?: number
                    is_hidden?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    course_id?: string
                    user_id?: string
                    type?: 'exam' | 'notes' | 'other'
                    file_name?: string
                    file_path?: string
                    file_url?: string
                    report_count?: number
                    is_hidden?: boolean
                    created_at?: string
                }
            }
            tags: {
                Row: {
                    id: string
                    name: string
                    type: 'positive' | 'negative'
                    is_verified: boolean
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    type: 'positive' | 'negative'
                    is_verified?: boolean
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    type?: 'positive' | 'negative'
                    is_verified?: boolean
                    created_by?: string | null
                    created_at?: string
                }
            }
            review_tags: {
                Row: {
                    review_id: string
                    tag_id: string
                }
                Insert: {
                    review_id: string
                    tag_id: string
                }
                Update: {
                    review_id?: string
                    tag_id?: string
                }
            }
            review_votes: {
                Row: {
                    id: string
                    review_id: string
                    user_id: string
                    vote_type: 'helpful' | 'missing_parts' | 'totally_wrong' | 'rage_bait'
                    created_at: string
                }
                Insert: {
                    id?: string
                    review_id: string
                    user_id: string
                    vote_type: 'helpful' | 'missing_parts' | 'totally_wrong' | 'rage_bait'
                    created_at?: string
                }
                Update: {
                    id?: string
                    review_id?: string
                    user_id?: string
                    vote_type?: 'helpful' | 'missing_parts' | 'totally_wrong' | 'rage_bait'
                    created_at?: string
                }
            }
            review_reports: {
                Row: {
                    id: string
                    review_id: string
                    reporter_id: string
                    reason: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    review_id: string
                    reporter_id: string
                    reason?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    review_id?: string
                    reporter_id?: string
                    reason?: string | null
                    created_at?: string
                }
            }
            file_reports: {
                Row: {
                    id: string
                    file_id: string
                    reporter_id: string
                    reason: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    file_id: string
                    reporter_id: string
                    reason?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    file_id?: string
                    reporter_id?: string
                    reason?: string | null
                    created_at?: string
                }
            }
        }
    }
}

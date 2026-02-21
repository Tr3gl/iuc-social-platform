export type Json =
 | string
 | number
 | boolean
 | null
 | { [key: string]: Json | undefined }
 | Json[]

export type Database = {
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
 created_at: string
 }
 Insert: {
 id?: string
 faculty_id: string
 name: string
 code: string
 created_at?: string
 }
 Update: {
 id?: string
 faculty_id?: string
 name?: string
 code?: string
 created_at?: string
 }
 }
 instructors: {
 Row: {
 id: string
 title: string | null
 name: string
 created_at: string
 }
 Insert: {
 id?: string
 title?: string | null
 name: string
 created_at?: string
 }
 Update: {
 id?: string
 title?: string | null
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
 difficulty_value_alignment: string
 exam_format: string
 midterm_format: string | null
 final_format: string | null
 extra_assessments: string[] | null
 survival_guide: string | null
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
 exam_clarity?: number
 grading_fairness?: number | null
 attendance?: number | null
 material_relevance?: number | null
 exam_predictability?: number | null
 difficulty_value_alignment: string
 exam_format?: string
 midterm_format?: string | null
 final_format?: string | null
 extra_assessments?: string[] | null
 survival_guide?: string | null
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
 difficulty_value_alignment?: string
 exam_format?: string
 midterm_format?: string | null
 final_format?: string | null
 extra_assessments?: string[] | null
 survival_guide?: string | null
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
 type:'exam' |'notes' |'other'
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
 type:'exam' |'notes' |'other'
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
 type?:'exam' |'notes' |'other'
 file_name?: string
 file_path?: string
 file_url?: string
 report_count?: number
 is_hidden?: boolean
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
 pending_survival_guides: {
 Row: {
 id: string
 course_id: string
 survival_guide: string
 submitted_by: string
 status:'pending' |'approved' |'rejected'
 created_at: string
 reviewed_at: string | null
 reviewed_by: string | null
 }
 Insert: {
 id?: string
 course_id: string
 survival_guide: string
 submitted_by: string
 status?:'pending' |'approved' |'rejected'
 created_at?: string
 reviewed_at?: string | null
 reviewed_by?: string | null
 }
 Update: {
 id?: string
 course_id?: string
 survival_guide?: string
 submitted_by?: string
 status?:'pending' |'approved' |'rejected'
 created_at?: string
 reviewed_at?: string | null
 reviewed_by?: string | null
 }
 }
 pending_tags: {
 Row: {
 id: string
 name: string
 suggested_type:'positive' |'negative'
 submitted_by: string
 course_id: string | null
 status:'pending' |'approved' |'rejected'
 created_at: string
 reviewed_at: string | null
 reviewed_by: string | null
 }
 Insert: {
 id?: string
 name: string
 suggested_type:'positive' |'negative'
 submitted_by: string
 course_id?: string | null
 status?:'pending' |'approved' |'rejected'
 created_at?: string
 reviewed_at?: string | null
 reviewed_by?: string | null
 }
 Update: {
 id?: string
 name?: string
 suggested_type?:'positive' |'negative'
 submitted_by?: string
 course_id?: string | null
 status?:'pending' |'approved' |'rejected'
 created_at?: string
 reviewed_at?: string | null
 reviewed_by?: string | null
 }
 }
 tags: {
 Row: {
 id: string
 name: string
 type:'positive' |'negative'
 is_verified: boolean
 created_by: string
 created_at: string
 }
 Insert: {
 id?: string
 name: string
 type:'positive' |'negative'
 is_verified?: boolean
 created_by: string
 created_at?: string
 }
 Update: {
 id?: string
 name?: string
 type?:'positive' |'negative'
 is_verified?: boolean
 created_by?: string
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
 vote_type:'helpful' |'missing_parts' |'totally_wrong' |'rage_bait'
 created_at: string
 }
 Insert: {
 id?: string
 review_id: string
 user_id: string
 vote_type:'helpful' |'missing_parts' |'totally_wrong' |'rage_bait'
 created_at?: string
 }
 Update: {
 id?: string
 review_id?: string
 user_id?: string
 vote_type?:'helpful' |'missing_parts' |'totally_wrong' |'rage_bait'
 created_at?: string
 }
 }
 }
 Functions: {
 get_course_stats: {
 Args: {
 course_uuid: string
 }
 Returns: Json
 }
 }
 }
}

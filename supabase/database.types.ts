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
          difficulty_value_alignment: 'well_balanced' | 'too_difficult' | 'too_easy'
          exam_format: 'written' | 'oral' | 'project' | 'mixed'
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
          difficulty_value_alignment: 'well_balanced' | 'too_difficult' | 'too_easy'
          exam_format: 'written' | 'oral' | 'project' | 'mixed'
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
          difficulty_value_alignment?: 'well_balanced' | 'too_difficult' | 'too_easy'
          exam_format?: 'written' | 'oral' | 'project' | 'mixed'
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
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          course_id: string
          survival_guide: string
          submitted_by: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          id?: string
          course_id?: string
          survival_guide?: string
          submitted_by?: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
      }
      pending_tags: {
        Row: {
          id: string
          name: string
          suggested_type: 'positive' | 'negative'
          submitted_by: string
          course_id: string | null
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          name: string
          suggested_type: 'positive' | 'negative'
          submitted_by: string
          course_id?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          suggested_type?: 'positive' | 'negative'
          submitted_by?: string
          course_id?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
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

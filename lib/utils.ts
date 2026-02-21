import { supabase } from './supabase';
import { MIN_REVIEWS_FOR_DISPLAY } from './constants';
import { CourseStats, Faculty, Course, Review, File, Tag, PendingSurvivalGuide, PendingTag, GradeDistribution } from './types';
import { PostgrestError } from '@supabase/supabase-js';

export { type CourseStats } from './types';

export const getCourseStats = async (courseId: string): Promise<CourseStats | null> => {
    const { data, error } = await supabase.rpc('get_course_stats', {
        course_uuid: courseId,
    });

    if (error) {
        console.error('Error fetching course stats:', error);
        return null;
    }

    const results = data as unknown as CourseStats[];
    if (!results || results.length === 0 || results[0].total_reviews < MIN_REVIEWS_FOR_DISPLAY) {
        return null;
    }

    return results[0];
};

// Search courses by name or code
export const searchCourses = async (query: string, limit = 10): Promise<Course[]> => {
    if (!query || query.trim().length < 2) return [];

    const searchTerm = query.trim();
    const { data, error } = await supabase
        .from('courses')
        .select(`
 *,
 faculties(id, name, name_tr)
`)
        .or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
        .limit(limit);

    if (error) {
        console.error('Error searching courses:', error);
        return [];
    }
    return (data || []) as unknown as Course[];
};

export const getFaculties = async (hideEmpty = true): Promise<Faculty[]> => {
    const { data, error } = await supabase
        .from('faculties')
        .select(`
 *,
 courses:courses(count)
`)
        .order('name');

    if (error) throw error;

    // Transform and filter
    const facultiesWithCounts = (data || []).map((faculty) => ({
        ...faculty,
        course_count: faculty.courses?.[0]?.count || 0,
    }));

    if (hideEmpty) {
        return facultiesWithCounts.filter((f) => f.course_count > 0);
    }

    return facultiesWithCounts;
};

// Get top-level faculties only (parent_id is NULL)
export const getTopLevelFaculties = async (): Promise<Faculty[]> => {
    const { data, error } = await supabase
        .from('faculties')
        .select(`
 *,
 courses:courses(count)
`)
        .is('parent_id', null)
        .order('name');

    if (error) throw error;

    // Also count child faculties (departments)
    const { data: allFaculties } = await supabase
        .from('faculties')
        .select('id, parent_id');

    const childCounts: Record<string, number> = {};
    (allFaculties || []).forEach((f) => {
        if (f.parent_id) {
            childCounts[f.parent_id] = (childCounts[f.parent_id] || 0) + 1;
        }
    });

    return (data || []).map((faculty) => ({
        ...faculty,
        course_count: faculty.courses?.[0]?.count || 0,
        child_count: childCounts[faculty.id] || 0,
    }));
};

// Get child faculties (departments) of a parent faculty
export const getChildFaculties = async (parentId: string): Promise<Faculty[]> => {
    const { data, error } = await supabase
        .from('faculties')
        .select(`
 *,
 courses:courses(count)
`)
        .eq('parent_id', parentId)
        .order('name');

    if (error) throw error;

    return (data || []).map((faculty) => ({
        ...faculty,
        course_count: faculty.courses?.[0]?.count || 0,
    }));
};

// Get a single faculty by ID with parent info
export const getFacultyById = async (facultyId: string): Promise<Faculty> => {
    const { data, error } = await supabase
        .from('faculties')
        .select(`
 *,
 parent:faculties!parent_id(id, name, name_tr)
`)
        .eq('id', facultyId)
        .single();

    if (error) throw error;
    // Use unknown casting first if strict typing fails due to join structure, 
    // but here it should match our Faculty type which includes optional parent
    return data as unknown as Faculty;
};

export const getCoursesByFaculty = async (facultyId: string): Promise<Course[]> => {
    const { data, error } = await supabase
        .from('courses')
        .select(`
 *,
 faculties(name, name_tr),
 course_instructors(
 instructors(id, name, title)
 ),
 reviews(count),
 files(count)
`)
        .eq('faculty_id', facultyId)
        .order('code');

    if (error) throw error;
    return (data || []) as unknown as Course[];
};

// Robustly get parent faculty details
export const getFacultyParent = async (parentId: string) => {
    const { data, error } = await supabase
        .from('faculties')
        .select('id, name, name_tr')
        .eq('id', parentId)
        .single();

    if (error) {
        console.error('Error fetching parent faculty:', error);
        return null;
    }
    return data;
};

export const getCourseById = async (courseId: string): Promise<Course> => {
    const { data, error } = await supabase
        .from('courses')
        .select(`
 *,
 faculties(id, name, name_tr),
 course_instructors(
 instructors(id, name, title)
 )
`)
        .eq('id', courseId)
        .single();

    if (error) throw error;
    return data as unknown as Course;
};

// ============================================================================
// Instructor Functions
// ============================================================================

export const getInstructorById = async (instructorId: string) => {
    const { data, error } = await supabase
        .from('instructors')
        .select('id, name')
        .eq('id', instructorId)
        .single();

    if (error) throw error;
    return data;
};

export const getCoursesByInstructor = async (instructorId: string): Promise<Course[]> => {
    const { data, error } = await supabase
        .from('courses')
        .select(`
 *,
 faculties(name, name_tr),
 course_instructors!inner(instructor_id),
 reviews(count),
 files(count)
`)
        .eq('course_instructors.instructor_id', instructorId)
        .order('code');

    if (error) throw error;
    return (data || []) as unknown as Course[];
};

export const searchInstructors = async (query: string, limit = 10) => {
    if (!query || query.trim().length < 2) return [];

    const searchTerm = query.trim();
    const { data, error } = await supabase
        .from('instructors')
        .select('id, name, title')
        .ilike('name', `%${searchTerm}%`)
        .limit(limit)
        .order('name');

    if (error) {
        console.error('Error searching instructors:', error);
        return [];
    }

    return data || [];
};

export const getInstructorsByFaculty = async (facultyId: string) => {
    const { data, error } = await supabase
        .from('courses')
        .select(`
 course_instructors(
 instructors(id, name, title)
 )
`)
        .eq('faculty_id', facultyId);

    if (error) throw error;

    // Extract, deduplicate by ID, and count courses
    // Since DB is normalized, we can group by instructor ID directly
    const instructorsMap = new Map();

    (data || []).forEach((course) => {
        if (course.course_instructors) {
            const cis = Array.isArray(course.course_instructors)
                ? course.course_instructors
                : [course.course_instructors];

            cis.forEach((ci: any) => {
                if (ci.instructors) {
                    const key = ci.instructors.id;
                    const existing = instructorsMap.get(key);

                    if (existing) {
                        instructorsMap.set(key, {
                            ...existing,
                            course_count: (existing.course_count || 0) + 1
                        });
                    } else {
                        instructorsMap.set(key, {
                            ...ci.instructors,
                            course_count: 1
                        });
                    }
                }
            });
        }
    });

    return Array.from(instructorsMap.values()).sort((a: any, b: any) =>
        a.name.localeCompare(b.name)
    );
};


export const getReviewsByCourse = async (courseId: string): Promise<Review[]> => {
    const { data, error } = await supabase
        .from('reviews')
        .select(`
 *,
 instructors(name),
 review_tags(
 tags(id, name, name_tr, type, is_verified)
 ),
 review_votes(
 user_id,
 vote_type
 )
`)
        .eq('course_id', courseId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as Review[];
};

export const getFilesByCourse = async (courseId: string): Promise<File[]> => {
    const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_hidden', false)
        .eq('is_verified', true) // Only show verified files
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
};

export const getUserReviewForCourse = async (courseId: string, userId: string): Promise<Review | null> => {
    const { data, error } = await supabase
        .from('reviews')
        .select(`
 *,
 review_tags(tag_id)
`)
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data as Review | null;
};

export const getTags = async (): Promise<Tag[]> => {
    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

    if (error) throw error;
    return data ?? [];
};

export const submitReview = async (reviewData: {
    course_id: string;
    instructor_id: string | null;
    difficulty: number;
    usefulness: number;
    workload: number;
    exam_clarity?: number;
    attendance: number | null;
    material_relevance: number | null;
    exam_predictability: number | null;
    survival_guide: string | null;
    difficulty_value_alignment: string;
    midterm_format: string;
    final_format: string;
    extra_assessments?: string[];
    comment?: string | null;
    tags?: string[];
}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Insert Review
    const { data: review, error } = await supabase
        .from('reviews')
        .insert({
            course_id: reviewData.course_id,
            instructor_id: reviewData.instructor_id,
            user_id: user.id,
            difficulty: reviewData.difficulty,
            usefulness: reviewData.usefulness,
            workload: reviewData.workload,
            exam_clarity: reviewData.exam_clarity ?? 3,
            attendance: reviewData.attendance,
            material_relevance: reviewData.material_relevance,
            exam_predictability: reviewData.exam_predictability,
            survival_guide: reviewData.survival_guide,
            difficulty_value_alignment: reviewData.difficulty_value_alignment,
            midterm_format: reviewData.midterm_format,
            final_format: reviewData.final_format,
            extra_assessments: reviewData.extra_assessments || [],
            exam_format: reviewData.midterm_format, // Backward compatibility for NOT NULL constraint if needed
            comment: reviewData.comment
        } as any)
        .select()
        .single();

    if (error) throw error;

    // Insert Tags
    if (reviewData.tags && reviewData.tags.length > 0) {
        const tagInserts = reviewData.tags.map(tagId => ({
            review_id: review.id,
            tag_id: tagId
        }));
        const { error: tagError } = await supabase
            .from('review_tags')
            .insert(tagInserts);

        if (tagError) console.error('Error inserting tags:', tagError);
    }

    return review;
};

export const updateReview = async (reviewId: string, reviewData: any) => {
    // Update main review fields
    // For tags, simplified: delete all and re-insert (not efficient but easiest for MVP)
    const { tags, ...mainData } = reviewData;

    const { data, error } = await supabase
        .from('reviews')
        .update(mainData)
        .eq('id', reviewId)
        .select()
        .single();

    if (error) throw error;

    if (tags) {
        // Delete existing tags
        await supabase.from('review_tags').delete().eq('review_id', reviewId);

        // Insert new tags
        const tagInserts = tags.map((tagId: string) => ({
            review_id: reviewId,
            tag_id: tagId
        }));
        await supabase.from('review_tags').insert(tagInserts);
    }

    return data;
};

export const toggleVote = async (reviewId: string, voteType: 'helpful' | 'missing_parts' | 'totally_wrong' | 'rage_bait'): Promise<{ action: 'added' | 'changed' | 'removed'; newVoteType: string | null }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check for existing vote
    const { data: existingVote } = await supabase
        .from('review_votes')
        .select('id, vote_type')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .maybeSingle();

    if (existingVote) {
        if (existingVote.vote_type === voteType) {
            // Same vote - remove it (toggle off)
            await supabase.from('review_votes').delete().eq('id', existingVote.id);
            return { action: 'removed', newVoteType: null };
        } else {
            // Different vote - update it
            await supabase.from('review_votes')
                .update({ vote_type: voteType })
                .eq('id', existingVote.id);
            return { action: 'changed', newVoteType: voteType };
        }
    } else {
        // No existing vote - insert new
        await supabase.from('review_votes')
            .insert({
                review_id: reviewId,
                user_id: user.id,
                vote_type: voteType,
            });
        return { action: 'added', newVoteType: voteType };
    }
};

export const deleteReview = async (reviewId: string) => {
    const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

    if (error) throw error;
};

export const reportReview = async (reviewId: string, reason?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('review_reports')
        .insert({
            review_id: reviewId,
            reporter_id: user.id,
            reason,
        });

    if (error) throw error;
};

export const uploadFile = async (
    courseId: string,
    file: any, // Browser File object, kept as any for compatibility or use File type from lib/dom?
    fileType: 'exam' | 'notes' | 'other'
) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${courseId}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
        .from('course-files')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('course-files')
        .getPublicUrl(filePath);

    // Insert file record
    const { data, error } = await supabase
        .from('files')
        .insert({
            course_id: courseId,
            user_id: user.id,
            type: fileType,
            file_name: file.name,
            file_path: filePath,
            file_url: publicUrl,
            is_verified: false, // Default to false
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Admin: Verify File
export const verifyFile = async (fileId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('files')
        .update({ is_verified: true })
        .eq('id', fileId);

    if (error) throw error;
};

// Admin: Reject (Delete) File
// We can reuse deleteFile logic, but maybe we want a specific rejection flow later
export const rejectFile = async (fileId: string, filePath: string) => {
    return deleteFile(fileId, filePath);
};

// Admin: Get Pending Files
export const getPendingFiles = async (): Promise<File[]> => {
    const { data, error } = await supabase
        .from('files')
        .select(`
 *,
 courses(name, code)
`)
        .eq('is_verified', false)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as File[];
};

export const deleteFile = async (fileId: string, filePath: string) => {
    // Delete from storage
    const { error: storageError } = await supabase.storage
        .from('course-files')
        .remove([filePath]);

    if (storageError) throw storageError;

    // Delete from database
    const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

    if (error) throw error;
};

export const reportFile = async (fileId: string, reason?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('file_reports')
        .insert({
            file_id: fileId,
            reporter_id: user.id,
            reason,
        });

    if (error) throw new Error(error.message || 'Rapor gönderilemedi');
};

// Custom Tag Submission
export const submitPendingTag = async (
    name: string,
    type: 'positive' | 'negative',
    courseId?: string
) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.from('pending_tags')
        .insert({
            name: name.trim(),
            suggested_type: type,
            submitted_by: user.id,
            course_id: courseId || null,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Admin functions for pending tags
export const getPendingTags = async (status: 'pending' | 'approved' | 'rejected' = 'pending') => {
    const { data, error } = await supabase.from('pending_tags')
        .select(`
 *,
 courses(name, code)
`)
        .eq('status', status)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
};

export const updatePendingTagStatus = async (
    tagId: string,
    status: 'approved' | 'rejected',
    newData?: { name: string; type: 'positive' | 'negative' }
) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Fetch pending tag data BEFORE updating status (or use newData if provided)
    let finalData: { name: string; suggested_type: 'positive' | 'negative' } | null = null;

    if (status === 'approved') {
        if (newData) {
            finalData = { name: newData.name, suggested_type: newData.type };
        } else {
            const { data } = await supabase.from('pending_tags')
                .select('name, suggested_type')
                .eq('id', tagId)
                .single();
            // @ts-ignore
            finalData = data;
        }
    }

    // Update status (and name/type if changed)
    const updatePayload: any = {
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
    };

    if (newData) {
        updatePayload.name = newData.name;
        updatePayload.suggested_type = newData.type;
    }

    const { error } = await supabase.from('pending_tags')
        .update(updatePayload)
        .eq('id', tagId);

    if (error) throw error;

    // If approved, create the actual tag
    if (status === 'approved' && finalData) {

        // Check if tag already exists to avoid duplicates
        const { data: existingTag } = await supabase.from('tags')
            .select('id')
            .ilike('name', finalData.name)
            .single();

        if (existingTag) {
            // Tag already exists, just mark pending as approved/duplicate? 
            // For now, we just don't create a new one.
            console.log('Tag already exists, skipping creation.');
        } else {
            const { error: insertError } = await supabase.from('tags').insert({
                name: finalData.name,
                type: finalData.suggested_type,
                is_verified: true,
                created_by: user.id, // Required by RLS policy
            });
            if (insertError) {
                console.error('Error creating tag:', insertError);
                throw new Error('Failed to create tag:' + insertError.message);
            }
        }
    }
};

// Get all reports for admin
export const getReviewReports = async () => {
    const { data, error } = await supabase.from('review_reports')
        .select(`
 *,
 reviews(
 id,
 comment,
 course_id,
 courses(id, name, code)
 )
`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
};

export const getFileReports = async () => {
    const { data, error } = await supabase.from('file_reports')
        .select(`
 *,
 files(
 id,
 file_name,
 courses(name, code)
 )
`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
};

// ============================================================================
// Grade Distribution Functions
// ============================================================================

export const getGradeDistributions = async (courseId: string): Promise<GradeDistribution[]> => {
    const { data, error } = await supabase
        .from('course_grade_distributions')
        .select('*')
        .eq('course_id', courseId)
        .order('academic_year', { ascending: false })
        .order('semester', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as GradeDistribution[];
};

export const submitGradeDistribution = async (distData: {
    course_id: string;
    academic_year: number;
    semester: string;
    exam_type: string;
    aa_lower: number; aa_upper: number;
    ba_lower: number; ba_upper: number;
    bb_lower: number; bb_upper: number;
    cb_lower: number; cb_upper: number;
    cc_lower: number; cc_upper: number;
    dc_lower: number; dc_upper: number;
    dd_lower: number; dd_upper: number;
    ff_lower: number; ff_upper: number;
}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const { data, error } = await supabase
        .from('course_grade_distributions')
        .insert({
            ...distData,
            submitted_by: user.id,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

// ============================================================================
// Survival Guide Moderation
// ============================================================================

export const submitPendingSurvivalGuide = async (
    courseId: string,
    survivalGuide: string
) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check for existing pending guide
    const { data: existingGuide } = await supabase
        .from('pending_survival_guides')
        .select('id')
        .eq('course_id', courseId)
        .eq('submitted_by', user.id)
        .eq('status', 'pending')
        .maybeSingle();

    if (existingGuide) {
        // Update existing
        const { data, error } = await supabase
            .from('pending_survival_guides')
            .update({
                survival_guide: survivalGuide.trim(),
                created_at: new Date().toISOString() // Bump timestamp to show it's fresh
            })
            .eq('id', existingGuide.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } else {
        // Insert new
        const { data, error } = await supabase.from('pending_survival_guides')
            .insert({
                course_id: courseId,
                survival_guide: survivalGuide.trim(),
                submitted_by: user.id,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

export const getUserPendingSurvivalGuides = async (courseId: string): Promise<PendingSurvivalGuide[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.from('pending_survival_guides')
        .select('*')
        .eq('course_id', courseId)
        .eq('submitted_by', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching pending guides:', error);
        return [];
    }
    return data ?? [];
};

export const getPendingSurvivalGuides = async (status: 'pending' | 'approved' | 'rejected' = 'pending'): Promise<any[]> => {
    const { data, error } = await supabase.from('pending_survival_guides')
        .select(`
 *,
 courses(name, code)
`)
        .eq('status', status)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
};

export const updateSurvivalGuideStatus = async (
    guideId: string,
    status: 'approved' | 'rejected'
) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Fetch the pending guide data BEFORE updating
    let guideData = null;
    if (status === 'approved') {
        const { data } = await supabase.from('pending_survival_guides')
            .select('course_id, survival_guide, submitted_by')
            .eq('id', guideId)
            .single();
        // @ts-ignore
        guideData = data;
    }

    // Update status
    const { error } = await supabase.from('pending_survival_guides')
        .update({
            status,
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
        })
        .eq('id', guideId);

    if (error) throw error;

    // If approved, update the user's review with the survival guide text
    if (status === 'approved' && guideData) {
        const { error: updateError } = await supabase.from('reviews')
            // @ts-ignore
            .update({ survival_guide: guideData.survival_guide })
            // @ts-ignore
            .eq('course_id', guideData.course_id)
            // @ts-ignore
            .eq('user_id', guideData.submitted_by);

        if (updateError) {
            console.error('Error updating review with survival guide:', updateError);
        }
    }
};

// ============================================================================
// Admin: Review Management Functions
// ============================================================================

export const getAllReviews = async () => {
    const { data, error } = await supabase
        .from('reviews')
        .select(`
 *,
 courses(name, code),
 review_votes(vote_type)
`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
};

export const getTrollReviews = async (minRageBaitVotes = 3) => {
    // Get all reviews with votes, then filter by rage_bait count
    const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
 *,
 courses(name, code),
 review_votes(vote_type)
`)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter reviews with rage_bait votes >= threshold
    const trollReviews = ((reviews ?? []) as any[]).filter((review: any) => {
        const rageBaitCount = (review.review_votes ?? []).filter(
            (v: any) => v.vote_type === 'rage_bait'
        ).length;
        return rageBaitCount >= minRageBaitVotes;
    });

    return trollReviews;
};

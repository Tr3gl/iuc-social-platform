'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase Service Key for Admin Actions');
}

// Admin Client with Service Role (Bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});

export async function checkAdminPassword(password: string): Promise<boolean> {
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'kovan2026';
    return password === adminPassword;
}

// ============================================================================
// TAGS
// ============================================================================

export async function rejectPendingTag(tagId: string) {
    const { error } = await supabaseAdmin
        .from('pending_tags')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', tagId);

    if (error) {
        console.error('Error rejecting tag:', error);
        throw new Error('Failed to reject tag');
    }

    revalidatePath('/admin');
    return { success: true };
}

export async function approvePendingTag(
    tagId: string,
    newData?: { name: string; type: 'positive' | 'negative' }
) {
    const pendingTagsTable = supabaseAdmin.from('pending_tags');

    // 1. Get current data if not provided (or to check existence)
    let tagName = newData?.name;
    let tagType = newData?.type;

    if (!tagName || !tagType) {
        const { data: existing } = await pendingTagsTable
            .select('name, suggested_type')
            .eq('id', tagId)
            .single();

        if (!existing) throw new Error('Tag request not found');
        tagName = tagName || existing.name;
        tagType = tagType || existing.suggested_type;
    }

    // 2. Mark as Approved
    const { error: updateError } = await pendingTagsTable
        .update({
            status: 'approved',
            name: tagName, // Update name/type in pending record too for history
            suggested_type: tagType,
            reviewed_at: new Date().toISOString()
        })
        .eq('id', tagId);

    if (updateError) throw updateError;

    // 3. Create Real Tag
    // Check duplicates first
    const { data: duplicate } = await supabaseAdmin
        .from('tags')
        .select('id')
        .ilike('name', tagName!)
        .maybeSingle();

    if (!duplicate) {
        const { error: insertError } = await supabaseAdmin
            .from('tags')
            .insert({
                name: tagName,
                type: tagType,
                is_verified: true,
                // created_by: SYSTEM or leave null if allowed, or use a dummy ID. 
                // Service role bypasses RLS so we don't strict need a user ID unless DB constraint requires it.
            });

        if (insertError) {
            console.error('Error creating tag:', insertError);
            throw new Error('Failed to create tag in system');
        }
    }

    revalidatePath('/admin');
    return { success: true };
}

// Direct Tag CRUD (Admin)
export async function getAllTags() {
    const { data, error } = await supabaseAdmin
        .from('tags')
        .select('*')
        .order('name');

    if (error) throw error;
    return data ?? [];
}

export async function createTag(name: string, type: 'positive' | 'negative') {
    // Check for duplicates
    const { data: existing } = await supabaseAdmin
        .from('tags')
        .select('id')
        .ilike('name', name)
        .maybeSingle();

    if (existing) {
        throw new Error('A tag with this name already exists');
    }

    const { error } = await supabaseAdmin
        .from('tags')
        .insert({ name, type, is_verified: true });

    if (error) throw error;
    revalidatePath('/admin');
    return { success: true };
}

export async function updateTag(tagId: string, name: string, type: 'positive' | 'negative') {
    const { error } = await supabaseAdmin
        .from('tags')
        .update({ name, type })
        .eq('id', tagId);

    if (error) throw error;
    revalidatePath('/admin');
    return { success: true };
}

export async function deleteTag(tagId: string) {
    // First delete all review_tags referencing this tag
    await supabaseAdmin
        .from('review_tags')
        .delete()
        .eq('tag_id', tagId);

    const { error } = await supabaseAdmin
        .from('tags')
        .delete()
        .eq('id', tagId);

    if (error) throw error;
    revalidatePath('/admin');
    return { success: true };
}

// ============================================================================
// REVIEWS
// ============================================================================

export async function deleteReview(reviewId: string) {
    const { error } = await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('id', reviewId);

    if (error) throw error;
    revalidatePath('/admin');
    return { success: true };
}

// ============================================================================
// FILES
// ============================================================================

export async function approveFile(fileId: string) {
    const { error } = await supabaseAdmin
        .from('files')
        .update({ is_verified: true })
        .eq('id', fileId);

    if (error) throw error;
    revalidatePath('/admin');
    return { success: true };
}

export async function rejectFile(fileId: string, filePath: string) {
    // 1. Delete from Storage
    const { error: storageError } = await supabaseAdmin.storage
        .from('course-files')
        .remove([filePath]);

    if (storageError) {
        console.error("Storage delete error:", storageError);
        // Continue to delete metadata anyway? Yes.
    }

    // 2. Delete from DB
    const { error } = await supabaseAdmin
        .from('files')
        .delete()
        .eq('id', fileId);

    if (error) throw error;

    revalidatePath('/admin');
    return { success: true };
}

// ============================================================================
// SURVIVAL GUIDES
// ============================================================================

export async function rejectSurvivalGuide(guideId: string) {
    const { error } = await supabaseAdmin
        .from('pending_survival_guides')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', guideId);

    if (error) throw error;
    revalidatePath('/admin');
    return { success: true };
}

export async function approveSurvivalGuide(guideId: string) {
    // 1. Get info
    const { data: guide } = await supabaseAdmin
        .from('pending_survival_guides')
        .select('*')
        .eq('id', guideId)
        .single();

    if (!guide) throw new Error("Guide not found");

    // 2. Update Status
    const { error: statusError } = await supabaseAdmin
        .from('pending_survival_guides')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', guideId);

    if (statusError) throw statusError;

    // 3. Update User Review
    const { error: reviewError } = await supabaseAdmin
        .from('reviews')
        .update({ survival_guide: guide.survival_guide })
        .eq('user_id', guide.submitted_by)
        .eq('course_id', guide.course_id);

    if (reviewError) {
        console.error("Failed to update user review with guide:", reviewError);
        // Don't fail the whole action, just log it.
    }

    revalidatePath('/admin');
    return { success: true };
}

// ============================================================================
// FACULTY REQUEST
// ============================================================================

export async function submitFacultyRequest(data: {
    facultyName: string;
    majorName?: string;
    email?: string;
    message?: string;
}) {
    const { error } = await supabaseAdmin
        .from('faculty_requests')
        .insert({
            faculty_name: data.facultyName,
            major_name: data.majorName || null,
            email: data.email || null,
            message: data.message || null,
        });

    if (error) {
        console.error('Error submitting faculty request:', error);
        throw new Error('Failed to submit faculty request');
    }
    return { success: true };
}

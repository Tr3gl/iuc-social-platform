-- Fix RLS for review_tags to allow deletion
-- This is necessary for the updateReview function which deletes all tags before re-inserting.

CREATE POLICY "Users can delete own review tags" 
    ON review_tags FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM reviews 
            WHERE id = review_id AND user_id = auth.uid()
        )
    );

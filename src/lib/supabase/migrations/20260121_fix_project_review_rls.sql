-- [IMPORTANT] Review Page Fix: Relax SELECT Policy on Project table
-- This allows anyone to view projects that are:
-- 1. Explicitly public or unlisted
-- 2. Have requested feedback (custom_data->'is_feedback_requested' = true)
-- 3. Is NULL (legacy projects treated as public)

DROP POLICY IF EXISTS "Enable read access for public and owners" ON "Project";
DROP POLICY IF EXISTS "Anyone can view public or unlisted projects" ON "Project";

CREATE POLICY "Public and shareable projects are viewable by everyone"
ON "Project" FOR SELECT
USING (
    visibility IS NULL 
    OR visibility IN ('public', 'unlisted')
    OR (custom_data::jsonb->>'is_feedback_requested')::boolean = true
    OR auth.uid() = user_id
);

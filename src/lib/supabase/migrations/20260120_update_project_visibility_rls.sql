
-- Update Project RLS to allow viewing unlisted projects
-- 'unlisted' means hidden from lists but accessible via direct link (and by ID query)

-- Drop existing public view policy if exists (name might vary, so dropping by common guess or recreating)
-- It's safer to drop the most likely policies.
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON "Project";
DROP POLICY IF EXISTS "Anyone can view public projects" ON "Project";
DROP POLICY IF EXISTS "Enable read access for all users" ON "Project";

-- Create new SELECT policy
CREATE POLICY "Anyone can view public or unlisted projects"
ON "Project" FOR SELECT
USING (
    visibility IN ('public', 'unlisted') 
    OR user_id = auth.uid()
);

-- Note: The main query filtering (to hide unlisted from main page) should be done in the application logic
-- by adding .eq('visibility', 'public') to the listing queries.

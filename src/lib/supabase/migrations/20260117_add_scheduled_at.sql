-- Add scheduled_at column to Project table for scheduled publishing
ALTER TABLE "Project" 
ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create an index for performance since we'll filter by this column often
CREATE INDEX IF NOT EXISTS "idx_project_scheduled_at" ON "Project" ("scheduled_at");

-- Update RLS policy if exists (Optional, depending on your setup)
-- For now, we assume filtering is handled in the application layer or API query.

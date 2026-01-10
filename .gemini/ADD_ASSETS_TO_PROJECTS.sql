-- Add assets column to projects table to store downloadable files
-- Each asset will have: { name, url, size, type }

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS assets JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN projects.assets IS 'Array of downloadable assets attached to the project';

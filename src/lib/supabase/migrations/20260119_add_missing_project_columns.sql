
-- 1. Add missing 'alt_description' column if not exists
ALTER TABLE "Project" 
ADD COLUMN IF NOT EXISTS alt_description TEXT;

COMMENT ON COLUMN "Project".alt_description IS '대체 텍스트 (접근성 및 SEO용)';

-- 2. Ensure 'scheduled_at' column exists (just in case)
ALTER TABLE "Project" 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- 3. Force PostgREST schema cache reload
-- This is crucial for the API to recognize the new columns immediately
NOTIFY pgrst, 'reload schema';

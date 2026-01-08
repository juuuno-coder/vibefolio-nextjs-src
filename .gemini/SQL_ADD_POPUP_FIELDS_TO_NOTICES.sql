
-- Add Popup related fields to notices table
ALTER TABLE notices ADD COLUMN IF NOT EXISTS is_popup BOOLEAN DEFAULT false;
ALTER TABLE notices ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE notices ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE notices ADD COLUMN IF NOT EXISTS link_text TEXT DEFAULT '자세히 보기';

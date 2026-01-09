-- SQL: recruit_items 테이블에 누락된 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- 1. source_link 컬럼 추가 (크롤링 원본 링크)
ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS source_link TEXT;

-- 2. 기타 누락될 수 있는 컬럼들 추가
ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS application_target TEXT;

ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS sponsor TEXT;

ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS total_prize TEXT;

ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS first_prize TEXT;

ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS start_date DATE;

ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS category_tags TEXT;

ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS banner_image_url TEXT;

ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS crawled_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- 3. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_recruit_items_approved 
ON recruit_items(is_approved, is_active);

CREATE INDEX IF NOT EXISTS idx_recruit_items_type 
ON recruit_items(type);

CREATE INDEX IF NOT EXISTS idx_recruit_items_date 
ON recruit_items(date);

-- 완료 메시지
SELECT 'recruit_items 테이블 스키마 업데이트 완료!' as message;

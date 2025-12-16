-- ============================================
-- public.users 테이블에 커버 이미지 URL 컬럼 추가
-- ============================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500);

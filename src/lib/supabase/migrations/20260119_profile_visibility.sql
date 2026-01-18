-- Migration: Add is_public to profiles
-- Created: 2026-01-19

-- 1. 프로필 공개 여부 추가 (기본값: 공개)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- 2. 기존 데이터에 기본값 적용 (이미 true지만 명시적으로)
UPDATE profiles SET is_public = true WHERE is_public IS NULL;

-- 3. 프로젝트 공개 여부 (visibility) 검증
-- Project 테이블에 visibility 컬럼이 없으면 추가 (text or enum)
-- 이미 있다면 pass. 보통 'public', 'private', 'link_only' 등을 씀.
-- 여기서는 단순화를 위해 text로 가정하고, 없으면 추가.
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Project' AND column_name = 'visibility'
    ) THEN 
        ALTER TABLE "Project" ADD COLUMN visibility TEXT DEFAULT 'public';
    END IF;
END $$;

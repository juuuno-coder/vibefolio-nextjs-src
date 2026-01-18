-- Migration: Enhance profiles for public profile page
-- Created: 2026-01-19

-- 1. username을 Unique, Not Null로 설정 (URL로 사용하기 위해)
-- 먼저 비어있는 username을 이메일 기반으로 채워줌
UPDATE profiles
SET username = SPLIT_PART((SELECT email FROM auth.users WHERE auth.users.id = profiles.id), '@', 1)
WHERE username IS NULL OR username = '';

-- 중복된 username이 있을 경우 숫자 추가 (간단한 충돌 해결)
-- (복잡한 로직은 애플리케이션 레벨이나 별도 스크립트로 처리 권장, 여기선 생략)

-- 2. social_links 컬럼 추가 (JSONB)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- 3. views_count (프로필 조회수) 추가
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 4. username 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 5. username 유효성 검사 (영문, 숫자, 밑줄, 하이픈만 허용)
ALTER TABLE profiles
ADD CONSTRAINT username_format_check 
CHECK (username ~* '^[a-zA-Z0-9_-]+$');

-- 6. username UNIQUE 제약 조건 추가 (이미 있을 수 있으니 안전하게)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key'
    ) THEN 
        ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
    END IF;
END $$;

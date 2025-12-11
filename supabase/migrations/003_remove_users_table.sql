-- users 테이블 제거 및 Auth 전환 마이그레이션
-- Supabase SQL Editor에서 실행

-- 1. Project 테이블의 user_id를 auth.users 참조로 변경
-- 기존 FK 제약조건 제거
ALTER TABLE public."Project" 
DROP CONSTRAINT IF EXISTS "Project_user_id_fkey";

-- auth.users를 직접 참조하도록 FK 추가
ALTER TABLE public."Project"
ADD CONSTRAINT "Project_user_id_fkey" 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Like 테이블
ALTER TABLE public."Like"
DROP CONSTRAINT IF EXISTS "Like_user_id_fkey";

ALTER TABLE public."Like"
ADD CONSTRAINT "Like_user_id_fkey"
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Wishlist 테이블
ALTER TABLE public."Wishlist"
DROP CONSTRAINT IF EXISTS "Wishlist_user_id_fkey";

ALTER TABLE public."Wishlist"
ADD CONSTRAINT "Wishlist_user_id_fkey"
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Comment 테이블
ALTER TABLE public."Comment"
DROP CONSTRAINT IF EXISTS "Comment_user_id_fkey";

ALTER TABLE public."Comment"
ADD CONSTRAINT "Comment_user_id_fkey"
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Follow 테이블 (있다면)
ALTER TABLE public."Follow"
DROP CONSTRAINT IF EXISTS "Follow_follower_id_fkey";

ALTER TABLE public."Follow"
DROP CONSTRAINT IF EXISTS "Follow_following_id_fkey";

ALTER TABLE public."Follow"
ADD CONSTRAINT "Follow_follower_id_fkey"
FOREIGN KEY (follower_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."Follow"
ADD CONSTRAINT "Follow_following_id_fkey"
FOREIGN KEY (following_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. users 테이블 제거 (모든 FK 변경 후)
DROP TABLE IF EXISTS public.users CASCADE;

-- 7. 트리거 제거 (있다면)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 완료!
-- 이제 모든 사용자 정보는 auth.users.user_metadata에 저장됩니다.

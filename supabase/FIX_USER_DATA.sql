-- 사용자 데이터 수동 생성 (긴급 수정)
-- Supabase SQL Editor에서 실행

-- 1. 현재 로그인한 사용자 ID 확인
-- Auth 대시보드에서 확인하거나 아래 쿼리 실행
-- SELECT id, email FROM auth.users;

-- 2. public.users 테이블에 사용자 추가
-- YOUR_USER_ID와 YOUR_EMAIL을 실제 값으로 교체하세요

INSERT INTO public.users (id, email, nickname, role, created_at, updated_at)
VALUES (
  '129d9d5b-08fd-443b-b0a9-65192decd0d3', -- 콘솔에서 확인한 사용자 ID
  'juuuno@naver.com', -- 이메일
  'juuuno', -- 닉네임
  'user', -- 역할 (admin으로 하려면 'admin')
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  nickname = EXCLUDED.nickname,
  updated_at = NOW();

-- 3. 확인
SELECT * FROM public.users WHERE email = 'juuuno@naver.com';

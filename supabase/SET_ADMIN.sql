-- juuuno@naver.com 계정을 관리자로 등록
-- Supabase SQL Editor에서 실행하세요.

-- 특정 이메일을 관리자로 변경
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'juuuno@naver.com';

-- 변경 확인
SELECT id, email, nickname, role, created_at 
FROM public.users 
WHERE email = 'juuuno@naver.com';

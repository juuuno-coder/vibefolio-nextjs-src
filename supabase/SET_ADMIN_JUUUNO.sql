-- juuuno@naver.com 사용자를 관리자로 설정
-- Supabase SQL Editor에서 실행

-- 1. 먼저 사용자 확인
SELECT id, email, role 
FROM users 
WHERE email = 'juuuno@naver.com';

-- 2. 관리자 권한 부여
UPDATE users 
SET role = 'admin' 
WHERE email = 'juuuno@naver.com';

-- 3. 확인
SELECT id, email, role 
FROM users 
WHERE email = 'juuuno@naver.com';

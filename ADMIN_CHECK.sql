-- 현재 등록된 모든 사용자 이메일 확인
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 특정 이메일로 admin 설정 (실제 이메일 확인 후 실행)
-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE id = (SELECT id FROM auth.users WHERE email = '실제이메일@naver.com');

-- [FINAL FIX] Project RLS Policy Enhancement
-- 목표: 익명 조회 허용 + 관리자(Admin)의 만능 권한 부여

-- 1. 기존 모든 SELECT 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "Enable read access for public and owners" ON "Project";
DROP POLICY IF EXISTS "Anyone can view public or unlisted projects" ON "Project";
DROP POLICY IF EXISTS "Public and shareable projects are viewable by everyone" ON "Project";
DROP POLICY IF EXISTS "Enable read access for all users" ON "Project";

-- 2. 통합 조회 정책 (SELECT): 익명(true) 또는 관리자
-- Review 페이지 작동을 위해 true로 설정하되, 리스트 노출은 앱 로직에서 처리
CREATE POLICY "Unified Project SELECT Access"
ON "Project" FOR SELECT
USING (
    true
);

-- 3. 통합 수정 정책 (UPDATE): 작성자 또는 관리자
DROP POLICY IF EXISTS "Enable update for owners" ON "Project";
CREATE POLICY "Enable update for owners or admins"
ON "Project" FOR UPDATE
USING (
    auth.uid() = user_id 
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. 통합 삭제 정책 (DELETE): 작성자 또는 관리자
DROP POLICY IF EXISTS "Enable delete for owners" ON "Project";
CREATE POLICY "Enable delete for owners or admins"
ON "Project" FOR DELETE
USING (
    auth.uid() = user_id 
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 5. 생성 정책 (INSERT): 인증된 사용자만
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "Project";
CREATE POLICY "Enable insert for authenticated users"
ON "Project" FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' 
    AND auth.uid() = user_id
);

-- Review 페이지를 위한 Project RLS 정책 수정
-- 목표: 익명 사용자도 모든 프로젝트를 조회할 수 있도록 허용

-- 기존 읽기 정책 삭제
DROP POLICY IF EXISTS "Enable read access for public and owners" ON "Project";

-- 새로운 읽기 정책: 모든 사용자가 모든 프로젝트 조회 가능
-- (Review 페이지에서 익명으로 평가할 수 있어야 하므로)
CREATE POLICY "Enable read access for all users"
ON "Project" FOR SELECT
USING (true);

-- 참고: UPDATE, DELETE, INSERT 정책은 그대로 유지
-- (작성자만 수정/삭제 가능, 인증된 사용자만 생성 가능)

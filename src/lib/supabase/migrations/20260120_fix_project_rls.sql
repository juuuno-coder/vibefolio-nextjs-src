-- 기존 정책 충돌 방지를 위해 기존 유사 정책 삭제 (안전하게 이름기반 삭제 시도)
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON "Project";
DROP POLICY IF EXISTS "Users can update own project" ON "Project";
DROP POLICY IF EXISTS "Users can delete own project" ON "Project";
DROP POLICY IF EXISTS "Users can insert own project" ON "Project";
DROP POLICY IF EXISTS "Enable read access for all users" ON "Project";

-- 기존 정책이 있다면 삭제하여 충돌 방지 (Idempotent)
DROP POLICY IF EXISTS "Enable read access for public and owners" ON "Project";
DROP POLICY IF EXISTS "Enable update for owners" ON "Project";
DROP POLICY IF EXISTS "Enable delete for owners" ON "Project";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "Project";

-- 1. 조회 (SELECT): 공개(public) 프로젝트이거나, 자신이 작성자인(user_id) 경우 허용
CREATE POLICY "Enable read access for public and owners"
ON "Project" FOR SELECT
USING (
  visibility = 'public'
  OR auth.uid() = user_id
);

-- 2. 수정 (UPDATE): 오직 작성자 본인만 허용
CREATE POLICY "Enable update for owners"
ON "Project" FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. 삭제 (DELETE): 오직 작성자 본인만 허용
CREATE POLICY "Enable delete for owners"
ON "Project" FOR DELETE
USING (auth.uid() = user_id);

-- 4. 생성 (INSERT): 인증된 사용자는 누구나 생성 가능 (단, user_id가 본인이어야 함)
CREATE POLICY "Enable insert for authenticated users"
ON "Project" FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- [ADMIN FIX] Inquiries RLS Policy Enhancement
-- 목표: 관리자(Admin)가 모든 문의사항을 조회하고 관리할 수 있도록 허용

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own inquiries" ON "inquiries";
DROP POLICY IF EXISTS "Users can insert own inquiries" ON "inquiries";
DROP POLICY IF EXISTS "Admins can view all inquiries" ON "inquiries";

-- 2. 조회 정책 (SELECT): 작성자 본인이거나 관리자(Admin)인 경우
CREATE POLICY "Admins and owners can view inquiries"
ON "inquiries" FOR SELECT
USING (
    auth.uid() = user_id 
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 3. 수정/삭제 정책 (UPDATE/DELETE): 관리자만 가능 (문의 답변 등)
CREATE POLICY "Admins can update inquiries"
ON "inquiries" FOR UPDATE
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete inquiries"
ON "inquiries" FOR DELETE
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 4. 생성 정책 (INSERT): 인증된 사용자 누구나 가능
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "inquiries";
CREATE POLICY "Enable insert for everyone"
ON "inquiries" FOR INSERT
WITH CHECK (true);

-- [2] Storage: 'recruit_files' 버킷 생성 및 권한 설정
-- 채용/공모전 첨부파일(PDF, HWP 등)을 위한 버킷입니다.

-- 1. 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('recruit_files', 'recruit_files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 기존 정책 초기화 (충돌 방지)
DROP POLICY IF EXISTS "Public Select recruit_files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert recruit_files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete recruit_files" ON storage.objects;

-- 3. 정책 설정

-- (1) 읽기/다운로드: 누구나 가능
CREATE POLICY "Public Select recruit_files"
ON storage.objects FOR SELECT
USING ( bucket_id = 'recruit_files' );

-- (2) 업로드: 로그인한 사용자만 가능
CREATE POLICY "Authenticated Insert recruit_files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'recruit_files' );

-- (3) 삭제: 자신이 올린 파일만 가능
CREATE POLICY "Authenticated Delete recruit_files"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'recruit_files' AND auth.uid() = owner );

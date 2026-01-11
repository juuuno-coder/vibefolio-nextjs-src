-- [Storage] Create 'project_assets' bucket and set policies
-- 이 스크립트를 실행하면 'project_assets' 버킷이 생성되고 파일 업로드/다운로드 권한이 설정됩니다.

-- 1. Create Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project_assets', 'project_assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts (Reset policies for this bucket)
DROP POLICY IF EXISTS "Public Select project_assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert project_assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update project_assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete project_assets" ON storage.objects;

-- 3. Create Policies

-- (1) 읽기/다운로드: 누구나 가능 (Public)
CREATE POLICY "Public Select project_assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'project_assets' );

-- (2) 업로드: 로그인한 사용자만 가능
CREATE POLICY "Authenticated Insert project_assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'project_assets' );

-- (3) 수정: 자신이 올린 파일만 가능
CREATE POLICY "Authenticated Update project_assets"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'project_assets' AND auth.uid() = owner );

-- (4) 삭제: 자신이 올린 파일만 가능
CREATE POLICY "Authenticated Delete project_assets"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'project_assets' AND auth.uid() = owner );

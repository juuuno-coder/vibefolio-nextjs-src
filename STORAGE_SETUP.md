# Supabase Storage 버킷 생성 가이드

## 1. profiles 버킷 생성 (프로필 이미지용)

### Supabase Dashboard에서:

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Storage** 클릭
4. **New bucket** 버튼 클릭
5. 설정:
   - Name: `profiles`
   - Public bucket: ✅ **체크**
   - File size limit: 5MB
   - Allowed MIME types: `image/*`
6. **Create bucket** 클릭

## 2. projects 버킷 확인

이미 `projects` 버킷이 있는지 확인하고, 없다면 생성:

- Name: `projects`
- Public bucket: ✅ **체크**
- File size limit: 10MB
- Allowed MIME types: `image/*`

## 3. notices 버킷 생성 (공지사항/팝업 이미지용)

- Name: `notices`
- Public bucket: ✅ **체크**
- File size limit: 5MB
- Allowed MIME types: `image/*`

## 4. recruits 버킷 생성 (채용/공모전 포스터용)

- Name: `recruits`
- Public bucket: ✅ **체크**
- File size limit: 5MB
- Allowed MIME types: `image/*`

## 5. 버킷 정책 설정 (선택사항)

각 버킷의 **Policies** 탭에서:

```sql
-- 모든 사용자가 읽기 가능
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profiles' );

-- 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'profiles' AND auth.role() = 'authenticated' );
```

## 완료!

버킷 생성 후 프로필 이미지 업로드를 다시 시도하세요.

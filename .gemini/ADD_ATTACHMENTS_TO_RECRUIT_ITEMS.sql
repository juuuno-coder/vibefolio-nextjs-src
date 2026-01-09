
-- recruit_items 테이블에 첨부파일 저장을 위한 JSONB 컬럼 추가
-- 저장 형식: [{ name: "filename.pdf", url: "https://...", size: 1024, type: "application/pdf" }]

ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- (선택 사항) Storage 버킷 'recruit_files'이 없다면 생성하고, 
-- public 접근 정책 및 인증된 사용자의 업로드 정책을 설정해야 합니다.
-- Supabase Dashboard > Storage 에서 설정 권장.

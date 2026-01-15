-- 20260115_add_version_to_notices.sql
-- Notices 테이블에 버전 관리를 위한 칼럼 추가
ALTER TABLE public.notices
ADD COLUMN version TEXT NULL,
ADD COLUMN category TEXT DEFAULT 'notice', -- 'notice', 'update', 'event', 'maintenance'
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- 코멘트 추가
COMMENT ON COLUMN public.notices.version IS '버전 번호 (예: 1.0.0)';
COMMENT ON COLUMN public.notices.category IS '공지 카테고리 (notice, update, event, maintenance)';
COMMENT ON COLUMN public.notices.tags IS '태그 배열';

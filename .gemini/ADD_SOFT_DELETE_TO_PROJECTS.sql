-- Project 테이블에 Soft Delete를 위한 컬럼 추가
ALTER TABLE "Project" 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN "Project".deleted_at IS '삭제된 시간 (Soft Delete). NULL이면 정상 게시물.';

-- [1] Project 테이블에 assets 컬럼 추가
-- 테이블 이름: "Project" (대소문자 구분)
-- 컬럼 타입: JSONB

ALTER TABLE "Project" 
ADD COLUMN IF NOT EXISTS assets JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN "Project".assets IS '다운로드 가능한 프로젝트 자산 목록 (JSON Array)';

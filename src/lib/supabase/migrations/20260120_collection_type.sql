-- Collection 테이블에 type 컬럼 추가
ALTER TABLE "Collection" 
ADD COLUMN "type" VARCHAR(50) DEFAULT 'bookmark';

COMMENT ON COLUMN "Collection"."type" IS 'bookmark: 일반 수집/저장, series: 시리즈/연재';

-- 기존 데이터 마이그레이션 (선택 사항): 
-- 일단 모든 기존 컬렉션은 'bookmark'로 유지하거나, 
-- 필요하다면 특정 조건(예: 이름이 'Season 1' 등)에 따라 업데이트 할 수 있음.
-- 여기서는 안전하게 기본값만 추가하고 스키마를 변경함.

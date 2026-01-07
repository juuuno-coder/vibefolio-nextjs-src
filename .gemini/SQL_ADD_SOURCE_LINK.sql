-- recruit_items 테이블에 소스 링크 필드 추가
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS source_link TEXT;

-- 기존 link 필드를 official_link로 의미상 사용하고, 
-- 원본 소스 주소를 source_link에 저장하기 위한 마이그레이션
COMMENT ON COLUMN recruit_items.link IS '주최측 공식 홈페이지 또는 지원 주소';
COMMENT ON COLUMN recruit_items.source_link IS '크롤링 원본 주소 (예: 위비티, 원티드 상세페이지)';

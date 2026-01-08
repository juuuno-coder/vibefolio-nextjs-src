-- recruit_items 테이블에 상세 정보 필드 추가
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS application_target TEXT;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS sponsor TEXT;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS total_prize TEXT;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS first_prize TEXT;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS category_tags TEXT;

-- 기존 prize를 total_prize로 마이그레이션할 수도 있지만 일단 놔둠
COMMENT ON COLUMN recruit_items.application_target IS '응모 대상 (예: 대학생, 일반인 등)';
COMMENT ON COLUMN recruit_items.sponsor IS '후원/협찬';
COMMENT ON COLUMN recruit_items.total_prize IS '총 상금';
COMMENT ON COLUMN recruit_items.first_prize IS '1등 상금';
COMMENT ON COLUMN recruit_items.start_date IS '접수 시작일';
COMMENT ON COLUMN recruit_items.category_tags IS '분야 태그 (예: 웹, 모바일, IT)';

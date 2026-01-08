-- recruit_items 테이블의 모든 필수 컬럼을 일괄 확인 및 추가하는 SQL 문입니다.
-- 어드민 저장 오류가 발생할 경우, 아래 스크립트를 SQL Editor에 복사하여 실행해 주세요.

-- 1. 기본 상세 정보 필드 추가
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS application_target TEXT;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS sponsor TEXT;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS total_prize TEXT;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS first_prize TEXT;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS category_tags TEXT;

-- 2. 배너 및 노출 설정 필드 추가
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS show_as_banner BOOLEAN DEFAULT false;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS banner_priority INTEGER DEFAULT 999;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS banner_image_url TEXT;

-- 3. 시스템 운영 필드 추가
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS source_link TEXT;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS crawled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 4. 컬럼 설명 (선택 사항)
COMMENT ON COLUMN recruit_items.source_link IS '크롤링 원본 페이지 주소';
COMMENT ON COLUMN recruit_items.banner_image_url IS '상세 페이지 상단 와이드 배너 이미지';

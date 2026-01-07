-- recruit_items 테이블에 배너 관련 필드 추가

-- 배너 표시 여부 컬럼 추가
ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS show_as_banner BOOLEAN DEFAULT false;

-- 배너 표시 위치 (둘러보기/연결하기)
ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS banner_location TEXT CHECK (banner_location IN ('discover', 'recruit', 'both'));

-- 배너 우선순위 (숫자가 낮을수록 먼저 표시)
ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS banner_priority INTEGER DEFAULT 999;

-- 배너 승인 시간
ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS banner_approved_at TIMESTAMP;

-- 배너 승인자
ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS banner_approved_by UUID REFERENCES auth.users(id);

-- 배너용 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_recruit_items_banner 
ON recruit_items(show_as_banner, banner_priority) 
WHERE show_as_banner = true AND is_active = true AND is_approved = true;

-- 코멘트 추가
COMMENT ON COLUMN recruit_items.show_as_banner IS '메인 페이지 배너로 표시 여부';
COMMENT ON COLUMN recruit_items.banner_location IS '배너 표시 위치: discover(둘러보기), recruit(연결하기), both(둘 다)';
COMMENT ON COLUMN recruit_items.banner_priority IS '배너 우선순위 (낮을수록 먼저 표시)';

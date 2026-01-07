-- recruit_items 테이블 기능 고도화 migration
-- 1. 조회수 필드 추가
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 2. 관리자 노출 설정 필드 추가
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS show_as_banner BOOLEAN DEFAULT false;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS banner_priority INTEGER DEFAULT 999;

-- 3. 승인 관련 필드 추가 (기존에 없었다면)
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE recruit_items ADD COLUMN IF NOT EXISTS crawled_at TIMESTAMP DEFAULT NOW();

-- 인덱스 추가 (배너 노출 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_recruit_items_banner ON recruit_items(show_as_banner, banner_priority) WHERE show_as_banner = true;

-- 조회수는 모든 사용자(익명 포함)가 업데이트 할 수 있도록 허용 (상세 페이지 방문 시)
-- 또는 보안상 관리자 권한(service_role)으로 서버에서만 업데이트하도록 권장

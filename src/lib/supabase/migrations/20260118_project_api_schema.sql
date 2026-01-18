-- =====================================================
-- Migration: Project API Schema Extensions
-- Date: 2026-01-18
-- Description: 외부 API 연동을 위한 스키마 확장
--   1. 복수 카테고리 지원 (project_categories)
--   2. 버전 관리 시스템 (project_versions)
--   3. API Key 관리 (api_keys)
--   4. 공개 범위 설정 (visibility 컬럼)
-- =====================================================

-- ============================================
-- 1. Project 테이블에 visibility 컬럼 추가
-- ============================================
ALTER TABLE "Project" 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted'));

COMMENT ON COLUMN "Project".visibility IS '공개 범위: public(전체공개), private(본인만), unlisted(링크만)';

-- ============================================
-- 2. 복수 카테고리 지원을 위한 중간 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS project_categories (
    project_id INTEGER NOT NULL REFERENCES "Project"(project_id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES "Category"(category_id) ON DELETE CASCADE,
    category_type TEXT DEFAULT 'genre' CHECK (category_type IN ('genre', 'field', 'tag')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (project_id, category_id)
);

COMMENT ON TABLE project_categories IS '프로젝트-카테고리 다대다 관계 (복수 카테고리 지원)';
COMMENT ON COLUMN project_categories.category_type IS '카테고리 유형: genre(장르), field(분야), tag(태그)';

CREATE INDEX IF NOT EXISTS idx_project_categories_project ON project_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_project_categories_category ON project_categories(category_id);

-- ============================================
-- 3. 프로젝트 버전 관리 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS project_versions (
    version_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES "Project"(project_id) ON DELETE CASCADE,
    version_tag TEXT NOT NULL, -- e.g., "1.0.0", "1.0.1"
    version_name TEXT, -- Optional display name
    changelog TEXT, -- 변경 사항 설명
    release_type TEXT CHECK (release_type IN ('major', 'minor', 'patch', 'initial')),
    
    -- 버전별 스냅샷 데이터
    snapshot_data JSONB, -- 해당 버전의 프로젝트 상태 저장
    
    -- 메타데이터
    released_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, version_tag)
);

COMMENT ON TABLE project_versions IS '프로젝트 버전 히스토리 관리';
COMMENT ON COLUMN project_versions.snapshot_data IS '버전별 프로젝트 데이터 스냅샷 (JSON)';

CREATE INDEX IF NOT EXISTS idx_project_versions_project ON project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_released ON project_versions(released_at DESC);

-- ============================================
-- 4. API Key 관리 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
    key_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- API Key 정보
    api_key TEXT NOT NULL UNIQUE, -- 실제 키 값 (해시 저장 권장)
    key_name TEXT, -- 사용자 지정 이름 (e.g., "My Dev Machine")
    key_prefix TEXT, -- 키 앞 4자리 표시용 (e.g., "vf_1234...")
    
    -- 권한 및 제한
    scopes TEXT[] DEFAULT ARRAY['projects:write', 'projects:read'], -- 권한 범위
    rate_limit_per_minute INTEGER DEFAULT 60,
    
    -- 상태
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- NULL이면 무기한
    
    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE api_keys IS '사용자별 API 인증 키 관리';
COMMENT ON COLUMN api_keys.api_key IS 'API Key (실제 사용 시 해시 저장 권장)';
COMMENT ON COLUMN api_keys.scopes IS '허용된 권한 범위 배열';

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key) WHERE is_active = TRUE;

-- ============================================
-- 5. RLS (Row Level Security) 정책
-- ============================================

-- project_categories RLS
ALTER TABLE project_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view project categories"
    ON project_categories FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can manage their project categories"
    ON project_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "Project" p
            WHERE p.project_id = project_categories.project_id
            AND p.user_id = auth.uid()
        )
    );

-- project_versions RLS
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view project versions"
    ON project_versions FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can manage their project versions"
    ON project_versions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "Project" p
            WHERE p.project_id = project_versions.project_id
            AND p.user_id = auth.uid()
        )
    );

-- api_keys RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
    ON api_keys FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own API keys"
    ON api_keys FOR ALL
    USING (user_id = auth.uid());

-- ============================================
-- 6. 헬퍼 함수: API Key 생성
-- ============================================
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
    key_value TEXT;
BEGIN
    -- 'vf_' 접두사 + 32자리 랜덤 문자열
    key_value := 'vf_' || encode(gen_random_bytes(24), 'hex');
    RETURN key_value;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_api_key IS 'API Key 생성 헬퍼 함수';

-- ============================================
-- 7. 헬퍼 함수: 최신 버전 조회
-- ============================================
CREATE OR REPLACE FUNCTION get_latest_version(p_project_id INTEGER)
RETURNS TABLE (
    version_tag TEXT,
    released_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT pv.version_tag, pv.released_at
    FROM project_versions pv
    WHERE pv.project_id = p_project_id
    ORDER BY pv.released_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_latest_version IS '프로젝트의 최신 버전 정보 조회';

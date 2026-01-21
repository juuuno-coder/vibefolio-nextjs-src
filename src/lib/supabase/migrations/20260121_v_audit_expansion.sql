-- =====================================================
-- Migration: V-Audit Schema Expansion
-- Date: 2026-01-21
-- Description: 가변 피드백 항목 지원을 위한 스키마 확장
--   1. ProjectRating 테이블에 score_5, score_6 추가
--   2. ProjectPoll 테이블 필드 확장 (다양한 투표 타입 지원)
-- =====================================================

-- 1. ProjectRating 스코어 컬럼 확장 (최대 6개)
ALTER TABLE "ProjectRating" 
ADD COLUMN IF NOT EXISTS score_5 DECIMAL(3, 1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_6 DECIMAL(3, 1) DEFAULT 0;

COMMENT ON COLUMN "ProjectRating".score_5 IS '커스텀 평가 항목 5';
COMMENT ON COLUMN "ProjectRating".score_6 IS '커스텀 평가 항목 6';

-- 2. ProjectPoll 인덱스 및 제약 조건 확인
-- 기존 vote_type이 'launch_now' 등으로 고정되어 있었으나, 이제 다양한 문자열 허용
ALTER TABLE "ProjectPoll" 
ALTER COLUMN vote_type TYPE VARCHAR(100);

-- 3. Project 테이블 custom_data 활용 가이드
COMMENT ON COLUMN "Project".custom_data IS 'V-Audit 설정 저장 (audit_type, custom_categories, poll_options 등)';

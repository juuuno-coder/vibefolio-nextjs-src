-- =====================================================
-- Migration: V-Audit Advanced Features
-- Date: 2026-01-21
-- Description: 
--   1. Project 테이블에 진단 기한(audit_deadline) 및 성장하기 요청(is_growth_requested) 추가
--   2. ProjectRating에 수정 이력(updated_count) 추가
-- =====================================================

-- 1. Project 테이블 확장
ALTER TABLE "Project" 
ADD COLUMN IF NOT EXISTS audit_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_growth_requested BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN "Project".audit_deadline IS 'V-Audit 진단 종료 기한';
COMMENT ON COLUMN "Project".is_growth_requested IS '바이브폴리오 성장하기(공개 진단) 등록 여부';

-- 2. ProjectRating 수정 가능 여부를 위한 컬럼 (선택사항이지만 유용함)
ALTER TABLE "ProjectRating"
ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;

COMMENT ON COLUMN "ProjectRating".edit_count IS '피드백 수정 횟수';

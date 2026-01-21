-- =====================================================
-- Migration: V-Audit Proposal & Custom Questions
-- Date: 2026-01-22
-- Description: 
--   1. ProjectRating 테이블에 proposal (TEXT) 및 custom_answers (JSONB) 추가
-- =====================================================

-- 1. ProjectRating 테이블 확장
ALTER TABLE "ProjectRating" 
ADD COLUMN IF NOT EXISTS proposal TEXT,
ADD COLUMN IF NOT EXISTS custom_answers JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN "ProjectRating".proposal IS '종합 개선 제안 (총평)';
COMMENT ON COLUMN "ProjectRating".custom_answers IS '프로젝트별 커스텀 질문에 대한 답변들';

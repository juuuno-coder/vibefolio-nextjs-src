-- Migration: Add expertise column to profiles
-- Date: 2026-01-20

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS expertise JSONB DEFAULT '{"fields": []}'::jsonb;

COMMENT ON COLUMN profiles.expertise IS '사용자의 전문 분야 정보 (JSON: {fields: []})';

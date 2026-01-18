-- Migration: Add interests column to profiles
-- Date: 2026-01-19

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '{"genres": [], "fields": []}'::jsonb;

COMMENT ON COLUMN profiles.interests IS '사용자의 관심 장르 및 분야 (JSON: {genres: [], fields: []})';

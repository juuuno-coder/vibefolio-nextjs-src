-- banners 테이블 고도화: 버튼 텍스트 및 설명 필드 추가

-- 설명(description) 필드 추가
ALTER TABLE banners 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 버튼 텍스트(button_text) 필드 추가
ALTER TABLE banners 
ADD COLUMN IF NOT EXISTS button_text TEXT DEFAULT '자세히 보기';

-- 코멘트 추가
COMMENT ON COLUMN banners.description IS '배너 추가 설명 문구';
COMMENT ON COLUMN banners.button_text IS '배너 버튼에 표시될 텍스트';

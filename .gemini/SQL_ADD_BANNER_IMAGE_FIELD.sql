-- recruit_items 테이블에 배너 전용 이미지 필드 추가
ALTER TABLE recruit_items 
ADD COLUMN IF NOT EXISTS banner_image_url TEXT;

COMMENT ON COLUMN recruit_items.banner_image_url IS '배너 노출 시 사용할 전용 와이드 이미지 URL';

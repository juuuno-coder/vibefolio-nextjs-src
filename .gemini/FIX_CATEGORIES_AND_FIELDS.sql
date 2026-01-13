-- 1. Fix Categories (Reset to 12 Vibefolio Categories)
-- Note: This assumes 'categories' table exists. 
-- If 'Project' table has FK constraint, we might need to handle it. 
-- For safety, we will UPSERT based on ID.

-- Delete existing categories if IDs are > 12 (Optional, but cleaner)
-- DELETE FROM categories WHERE id > 12;

-- Upsert the 12 Standard Categories
INSERT INTO categories (id, name, slug) VALUES
(1, '포토', 'photo'),
(2, '웹툰/애니', 'animation'),
(3, '그래픽', 'graphic'),
(4, '디자인', 'design'),
(5, '영상', 'video'),
(6, '영화·드라마', 'cinema'),
(7, '오디오', 'audio'),
(8, '3D', '3d'),
(9, '텍스트', 'text'),
(10, '코드', 'code'),
(11, '웹/앱', 'webapp'),
(12, '게임', 'game')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, slug = EXCLUDED.slug;

-- 2. Ensure Fields are Seeded Correctly
-- (Just in case they are missing or have different IDs)
INSERT INTO fields (slug, name) VALUES
('finance', '경제/금융'),
('healthcare', '헬스케어'),
('beauty', '뷰티/패션'),
('pet', '반려'),
('fnb', 'F&B'),
('travel', '여행/레저'),
('education', '교육'),
('it', 'IT'),
('lifestyle', '라이프스타일'),
('business', '비즈니스'),
('art', '문화/예술'),
('marketingt', '마케팅'),
('other', '기타')
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name;

-- 카테고리 테이블에 StickyMenu 카테고리 추가
-- Supabase SQL Editor에서 실행하세요

-- 기존 카테고리 삭제 (선택사항)
-- DELETE FROM "Category";

-- StickyMenu와 동일한 카테고리 추가
INSERT INTO "Category" (name) VALUES
('전체'),
('영상/모션그래픽'),
('그래픽 디자인'),
('브랜딩/편집'),
('UI/UX'),
('일러스트레이션'),
('디지털 아트'),
('AI'),
('캐릭터 디자인'),
('제품/패키지 디자인'),
('포토그래피'),
('타이포그래피'),
('공예'),
('파인아트')
ON CONFLICT (name) DO NOTHING;

-- 확인
SELECT * FROM "Category" ORDER BY category_id;

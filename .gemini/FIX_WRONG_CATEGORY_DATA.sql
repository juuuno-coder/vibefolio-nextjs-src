-- 1. 카테고리 정의 확실히 하기 (코드와 DB 동기화)
-- 기존 데이터가 꼬여있을 수 있으므로 이름을 강제로 업데이트합니다.
INSERT INTO public.categories (id, name) VALUES
(1, '포토'),
(2, '웹툰/애니'),
(3, '그래픽'),
(4, '디자인'),
(5, '영상'),
(6, '영화·드라마'),
(7, '오디오'),
(8, '3D'),
(9, '텍스트'),
(10, '코드'),
(11, '웹/앱'), -- 여기가 중요합니다. 11번은 확실히 웹/앱이어야 합니다.
(12, '게임')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. 잘못 분류된 프로젝트들 데이터 이동 (영상 -> 웹/앱)
-- 스크린샷에 보이는 프로젝트들을 특정하여 category_id를 11(웹/앱)로 변경합니다.
-- 현재 이 프로젝트들이 영상(5) 카테고리에 잘못 들어가 있는 것으로 추정됩니다.

UPDATE public."Project"
SET category_id = 11 -- 11: 웹/앱
WHERE title LIKE '%메디엣지%'
   OR title LIKE '%키보드 피아노%'
   OR title LIKE '%다운뷰%'
   OR title LIKE '%리팩토링%'
   OR title LIKE '%Next.js%' -- 추가로 웹 관련일 수 있는 것들
   OR title LIKE '%React%'
   OR title LIKE '%Vibefolio%';

-- 3. 확인용: 변경된 프로젝트 수 확인 (선택 사항)
-- SELECT count(*) FROM public."Project" WHERE category_id = 11;

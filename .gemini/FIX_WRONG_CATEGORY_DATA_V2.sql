-- 참고: public.categories 테이블이 없으므로 카테고리 정의 INSERT 문은 생략합니다.
-- 우리는 Project 테이블의 category_id 만 수정하면 됩니다.

-- 1. 잘못 분류된 프로젝트들 데이터 이동 (영상 -> 웹/앱)
-- '메디엣지', '키보드 피아노' 등은 웹 어플리케이션이므로 category_id를 11로 변경합니다.
-- (코드상 11: 웹/앱, 5: 영상)

UPDATE public."Project"
SET category_id = 11 -- 11: 웹/앱
WHERE title LIKE '%메디엣지%'
   OR title LIKE '%키보드 피아노%'
   OR title LIKE '%다운뷰%'
   OR title LIKE '%리팩토링%'
   OR title LIKE '%Next.js%'
   OR title LIKE '%React%'
   OR title LIKE '%Vibefolio%'
   OR title LIKE '%홈페이지%'; -- 홈페이지 리팩토링 포함

-- 확인용: 변경된 결과 조회
-- SELECT id, title, category_id FROM public."Project" WHERE category_id = 11;

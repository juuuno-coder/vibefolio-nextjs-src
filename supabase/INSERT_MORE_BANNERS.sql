-- 추가 배너 4개 삽입
INSERT INTO public.banners (title, subtitle, image_url, bg_color, text_color, display_order, is_active) VALUES
(
  'Digital Art Week', 
  '이번 주 가장 핫한 디지털 아트 컬렉션', 
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2670&auto=format&fit=crop', 
  '#4a148c', 
  '#ffffff',
  3,
  true
),
(
  'Motion Design Trends', 
  '움직임으로 시선을 사로잡는 모션 그래픽', 
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop', 
  '#0d47a1', 
  '#ffffff',
  4,
  true
),
(
  '3D Rendering Masterclass', 
  '현직 전문가가 알려주는 3D 렌더링 노하우', 
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop', 
  '#1b5e20', 
  '#ffffff',
  5,
  true
),
(
  'Photography Exhibition', 
  '빛과 그림자가 만들어내는 찰나의 순간', 
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2670&auto=format&fit=crop', 
  '#b71c1c', 
  '#ffffff',
  6,
  true
);

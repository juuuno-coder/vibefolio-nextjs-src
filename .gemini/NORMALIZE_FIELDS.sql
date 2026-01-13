-- 1. Fields 테이블 생성 (분야 마스터 테이블)
CREATE TABLE IF NOT EXISTS public.fields (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,  -- 'it', 'finance' 등 코드값
    name TEXT NOT NULL,         -- 'IT', '경제/금융' 등 표시명
    sort_order INTEGER DEFAULT 0, -- 정렬 순서
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 기본 분야 데이터 입력 (Initial Seed Data)
INSERT INTO public.fields (slug, name, sort_order) VALUES
('finance', '경제/금융', 10),
('healthcare', '헬스케어', 20),
('beauty', '뷰티/패션', 30),
('pet', '반려', 40),
('fnb', 'F&B', 50),
('travel', '여행/레저', 60),
('education', '교육', 70),
('it', 'IT', 80),
('lifestyle', '라이프스타일', 90),
('business', '비즈니스', 100),
('art', '문화/예술', 110),
('marketingt', '마케팅', 120),
('other', '기타', 999)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 3. Project - Fields 연결 테이블 생성 (N:M 관계 테이블)
-- 하나의 프로젝트가 여러 분야를 가질 수 있도록 설계
CREATE TABLE IF NOT EXISTS public.project_fields (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES public."Project"(project_id) ON DELETE CASCADE,
    field_id INTEGER NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, field_id) -- 중복 방지
);

-- 4. 권한 설정 (RLS)
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_fields ENABLE ROW LEVEL SECURITY;

-- 누구나 분야 목록 조회 가능
CREATE POLICY "Allow public read fields" ON public.fields FOR SELECT USING (true);
CREATE POLICY "Allow public read project_fields" ON public.project_fields FOR SELECT USING (true);

-- 인증된 사용자만 연결 정보 추가/삭제 가능 (본인 프로젝트인지는 API단에서 체크 권장 혹은 추가 정책 필요)
CREATE POLICY "Allow authenticated insert project_fields" ON public.project_fields FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete project_fields" ON public.project_fields FOR DELETE USING (auth.role() = 'authenticated');

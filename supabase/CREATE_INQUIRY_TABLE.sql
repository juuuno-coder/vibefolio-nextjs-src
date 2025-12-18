-- Inquiries 테이블 생성
CREATE TABLE IF NOT EXISTS public.inquiries (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- 로그인한 유저일 경우
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    title VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, answered
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 정책 설정 (필요시)
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 문의 조회 가능, 일반 사용자는 자신의 문의만(또는 insert만)
CREATE POLICY "Allow public insert" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin select" ON public.inquiries FOR SELECT USING (auth.role() = 'service_role' OR auth.email() = 'admin@example.com'); -- 관리자 조건은 프로젝트에 맞게 수정 필요

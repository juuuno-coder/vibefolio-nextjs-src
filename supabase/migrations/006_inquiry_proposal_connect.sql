-- 1:1 문의 및 제안 시스템
-- Supabase SQL Editor에서 실행하세요

-- 1. 1:1 문의 테이블
CREATE TABLE IF NOT EXISTS public."Inquiry" (
  inquiry_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'answered'
  answer TEXT,
  answered_by UUID REFERENCES auth.users(id),
  answered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 제안 테이블
CREATE TABLE IF NOT EXISTS public."Proposal" (
  proposal_id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES public."Project"(project_id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  contact VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 채용 공고 테이블
CREATE TABLE IF NOT EXISTS public."JobPosting" (
  job_id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  benefits TEXT,
  location VARCHAR(255),
  employment_type VARCHAR(50), -- 'full-time', 'part-time', 'contract'
  salary_range VARCHAR(100),
  deadline DATE,
  apply_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 외주 의뢰 테이블
CREATE TABLE IF NOT EXISTS public."Freelance" (
  freelance_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  budget VARCHAR(100),
  deadline DATE,
  category_id INTEGER REFERENCES public."Category"(category_id),
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'completed', 'closed'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RLS 활성화
ALTER TABLE public."Inquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Proposal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."JobPosting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Freelance" ENABLE ROW LEVEL SECURITY;

-- 6. Inquiry RLS 정책
-- 본인 문의만 조회 가능
CREATE POLICY "Users can view their own inquiries"
  ON public."Inquiry" FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 문의만 작성 가능
CREATE POLICY "Users can create inquiries"
  ON public."Inquiry" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 문의 조회 가능
CREATE POLICY "Admins can view all inquiries"
  ON public."Inquiry" FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public."Admin")
  );

-- 관리자는 답변 가능
CREATE POLICY "Admins can answer inquiries"
  ON public."Inquiry" FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM public."Admin")
  );

-- 7. Proposal RLS 정책
-- 발신자와 수신자만 조회 가능
CREATE POLICY "Users can view their proposals"
  ON public."Proposal" FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- 로그인한 사용자만 제안 가능
CREATE POLICY "Authenticated users can create proposals"
  ON public."Proposal" FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- 수신자만 상태 변경 가능
CREATE POLICY "Receivers can update proposal status"
  ON public."Proposal" FOR UPDATE
  USING (auth.uid() = receiver_id);

-- 8. JobPosting RLS 정책
-- 누구나 활성 채용 공고 조회 가능
CREATE POLICY "Anyone can view active job postings"
  ON public."JobPosting" FOR SELECT
  USING (is_active = true);

-- 관리자만 채용 공고 관리 가능
CREATE POLICY "Admins can manage job postings"
  ON public."JobPosting" FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public."Admin")
  );

-- 9. Freelance RLS 정책
-- 누구나 활성 외주 의뢰 조회 가능
CREATE POLICY "Anyone can view active freelance posts"
  ON public."Freelance" FOR SELECT
  USING (is_active = true);

-- 로그인한 사용자만 외주 의뢰 등록 가능
CREATE POLICY "Authenticated users can create freelance posts"
  ON public."Freelance" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 외주 의뢰만 수정/삭제 가능
CREATE POLICY "Users can manage their own freelance posts"
  ON public."Freelance" FOR ALL
  USING (auth.uid() = user_id);

-- 확인
SELECT * FROM public."Inquiry";
SELECT * FROM public."Proposal";
SELECT * FROM public."JobPosting";
SELECT * FROM public."Freelance";

-- Vibefolio RLS (Row Level Security) 정책 설정
-- 이 SQL을 Supabase SQL Editor에서 실행하세요.

-- ============================================
-- 1. users 테이블 RLS 정책 (이미 설정되어 있을 수 있음)
-- ============================================
-- 누구나 프로필 조회 가능
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.users FOR SELECT
  USING ( true );

-- 본인만 프로필 생성 가능
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
CREATE POLICY "Users can insert their own profile."
  ON public.users FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- 본인만 프로필 수정 가능
DROP POLICY IF EXISTS "Users can update their own profile." ON public.users;
CREATE POLICY "Users can update their own profile."
  ON public.users FOR UPDATE
  USING ( auth.uid() = id );

-- ============================================
-- 2. Project 테이블 RLS 정책
-- ============================================
ALTER TABLE public."Project" ENABLE ROW LEVEL SECURITY;

-- 누구나 프로젝트 조회 가능
DROP POLICY IF EXISTS "Anyone can view projects" ON public."Project";
CREATE POLICY "Anyone can view projects"
  ON public."Project" FOR SELECT
  USING ( true );

-- 로그인한 사용자만 프로젝트 생성 가능
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public."Project";
CREATE POLICY "Authenticated users can create projects"
  ON public."Project" FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- 본인 프로젝트만 수정 가능
DROP POLICY IF EXISTS "Users can update their own projects" ON public."Project";
CREATE POLICY "Users can update their own projects"
  ON public."Project" FOR UPDATE
  USING ( auth.uid() = user_id );

-- 본인 프로젝트만 삭제 가능
DROP POLICY IF EXISTS "Users can delete their own projects" ON public."Project";
CREATE POLICY "Users can delete their own projects"
  ON public."Project" FOR DELETE
  USING ( auth.uid() = user_id );

-- ============================================
-- 3. Like 테이블 RLS 정책
-- ============================================
ALTER TABLE public."Like" ENABLE ROW LEVEL SECURITY;

-- 누구나 좋아요 수 조회 가능
DROP POLICY IF EXISTS "Anyone can view likes" ON public."Like";
CREATE POLICY "Anyone can view likes"
  ON public."Like" FOR SELECT
  USING ( true );

-- 로그인한 사용자만 좋아요 추가 가능
DROP POLICY IF EXISTS "Authenticated users can like projects" ON public."Like";
CREATE POLICY "Authenticated users can like projects"
  ON public."Like" FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- 본인 좋아요만 삭제 가능 (좋아요 취소)
DROP POLICY IF EXISTS "Users can remove their own likes" ON public."Like";
CREATE POLICY "Users can remove their own likes"
  ON public."Like" FOR DELETE
  USING ( auth.uid() = user_id );

-- ============================================
-- 4. Wishlist (컬렉션/북마크) 테이블 RLS 정책
-- ============================================
ALTER TABLE public."Wishlist" ENABLE ROW LEVEL SECURITY;

-- 본인 위시리스트만 조회 가능
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public."Wishlist";
CREATE POLICY "Users can view their own wishlist"
  ON public."Wishlist" FOR SELECT
  USING ( auth.uid() = user_id );

-- 로그인한 사용자만 위시리스트 추가 가능
DROP POLICY IF EXISTS "Authenticated users can add to wishlist" ON public."Wishlist";
CREATE POLICY "Authenticated users can add to wishlist"
  ON public."Wishlist" FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- 본인 위시리스트만 삭제 가능
DROP POLICY IF EXISTS "Users can remove from their own wishlist" ON public."Wishlist";
CREATE POLICY "Users can remove from their own wishlist"
  ON public."Wishlist" FOR DELETE
  USING ( auth.uid() = user_id );

-- ============================================
-- 5. Comment 테이블 RLS 정책
-- ============================================
ALTER TABLE public."Comment" ENABLE ROW LEVEL SECURITY;

-- 누구나 댓글 조회 가능
DROP POLICY IF EXISTS "Anyone can view comments" ON public."Comment";
CREATE POLICY "Anyone can view comments"
  ON public."Comment" FOR SELECT
  USING ( true );

-- 로그인한 사용자만 댓글 작성 가능
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public."Comment";
CREATE POLICY "Authenticated users can create comments"
  ON public."Comment" FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- 본인 댓글만 수정 가능
DROP POLICY IF EXISTS "Users can update their own comments" ON public."Comment";
CREATE POLICY "Users can update their own comments"
  ON public."Comment" FOR UPDATE
  USING ( auth.uid() = user_id );

-- 본인 댓글만 삭제 가능
DROP POLICY IF EXISTS "Users can delete their own comments" ON public."Comment";
CREATE POLICY "Users can delete their own comments"
  ON public."Comment" FOR DELETE
  USING ( auth.uid() = user_id );

-- ============================================
-- 6. Category 테이블 RLS 정책
-- ============================================
ALTER TABLE public."Category" ENABLE ROW LEVEL SECURITY;

-- 누구나 카테고리 조회 가능
DROP POLICY IF EXISTS "Anyone can view categories" ON public."Category";
CREATE POLICY "Anyone can view categories"
  ON public."Category" FOR SELECT
  USING ( true );

-- ============================================
-- 7. Follow 테이블 생성 및 RLS 정책
-- ============================================
CREATE TABLE IF NOT EXISTS public."Follow" (
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id) -- 자기 자신 팔로우 방지
);

ALTER TABLE public."Follow" ENABLE ROW LEVEL SECURITY;

-- 누구나 팔로우 관계 조회 가능
DROP POLICY IF EXISTS "Anyone can view follows" ON public."Follow";
CREATE POLICY "Anyone can view follows"
  ON public."Follow" FOR SELECT
  USING ( true );

-- 로그인한 사용자만 팔로우 가능
DROP POLICY IF EXISTS "Authenticated users can follow" ON public."Follow";
CREATE POLICY "Authenticated users can follow"
  ON public."Follow" FOR INSERT
  WITH CHECK ( auth.uid() = follower_id );

-- 본인 팔로우만 취소 가능
DROP POLICY IF EXISTS "Users can unfollow" ON public."Follow";
CREATE POLICY "Users can unfollow"
  ON public."Follow" FOR DELETE
  USING ( auth.uid() = follower_id );

-- ============================================
-- 8. JobPosting 테이블 RLS 정책
-- ============================================
ALTER TABLE public."JobPosting" ENABLE ROW LEVEL SECURITY;

-- 누구나 채용공고 조회 가능
DROP POLICY IF EXISTS "Anyone can view job postings" ON public."JobPosting";
CREATE POLICY "Anyone can view job postings"
  ON public."JobPosting" FOR SELECT
  USING ( true );

-- 관리자만 채용공고 생성/수정/삭제 가능 (role = 'admin')
DROP POLICY IF EXISTS "Admins can manage job postings" ON public."JobPosting";
CREATE POLICY "Admins can manage job postings"
  ON public."JobPosting" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 9. OutsourcingRequest 테이블 RLS 정책
-- ============================================
ALTER TABLE public."OutsourcingRequest" ENABLE ROW LEVEL SECURITY;

-- 로그인한 사용자만 외주 요청 조회 가능
DROP POLICY IF EXISTS "Authenticated users can view requests" ON public."OutsourcingRequest";
CREATE POLICY "Authenticated users can view requests"
  ON public."OutsourcingRequest" FOR SELECT
  USING ( auth.uid() IS NOT NULL );

-- 로그인한 사용자만 외주 요청 생성 가능 (본인만)
DROP POLICY IF EXISTS "Users can create their own requests" ON public."OutsourcingRequest";
CREATE POLICY "Users can create their own requests"
  ON public."OutsourcingRequest" FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- 본인 요청만 수정 가능
DROP POLICY IF EXISTS "Users can update their own requests" ON public."OutsourcingRequest";
CREATE POLICY "Users can update their own requests"
  ON public."OutsourcingRequest" FOR UPDATE
  USING ( auth.uid() = user_id );

-- ============================================
-- 10. Proposal 테이블 RLS 정책
-- ============================================
ALTER TABLE public."Proposal" ENABLE ROW LEVEL SECURITY;

-- 본인 제안만 조회 가능
DROP POLICY IF EXISTS "Users can view their own proposals" ON public."Proposal";
CREATE POLICY "Users can view their own proposals"
  ON public."Proposal" FOR SELECT
  USING ( auth.uid() = user_id );

-- 로그인한 사용자만 제안 생성 가능
DROP POLICY IF EXISTS "Authenticated users can create proposals" ON public."Proposal";
CREATE POLICY "Authenticated users can create proposals"
  ON public."Proposal" FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- 본인 제안만 수정 가능
DROP POLICY IF EXISTS "Users can update their own proposals" ON public."Proposal";
CREATE POLICY "Users can update their own proposals"
  ON public."Proposal" FOR UPDATE
  USING ( auth.uid() = user_id );

-- ============================================
-- 완료! 모든 RLS 정책이 설정되었습니다.
-- ============================================

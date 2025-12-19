-- 기존 정책 삭제 (중복 방지)
DROP POLICY IF EXISTS "Active banners are viewable by everyone." ON public.banners;
DROP POLICY IF EXISTS "Admins can manage banners." ON public.banners;

-- 테이블에 대한 기본 SELECT 권한 부여 (비로그인/로그인 사용자 모두에게)
GRANT SELECT ON public.banners TO anon, authenticated;

-- RLS 정책 재설정
-- 1. 누구나 활성화된(is_active=true) 배너 조회 가능
CREATE POLICY "Active banners are viewable by everyone."
  ON public.banners
  FOR SELECT
  TO public
  USING (is_active = true);

-- 2. 관리자는 모든 권한 가짐
CREATE POLICY "Admins can manage banners."
  ON public.banners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Popups 테이블도 동일하게 FIX
GRANT SELECT ON public.popups TO anon, authenticated;

DROP POLICY IF EXISTS "Active popups are viewable by everyone." ON public.popups;
CREATE POLICY "Active popups are viewable by everyone."
  ON public.popups
  FOR SELECT
  TO public
  USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );

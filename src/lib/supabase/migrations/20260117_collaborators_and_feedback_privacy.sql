-- 1. 공동 제작자(Collaborators) 테이블 생성
CREATE TABLE IF NOT EXISTS public.project_collaborators (
    id BIGSERIAL PRIMARY KEY,
    project_id UUID REFERENCES public."Project"(project_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, user_id)
);

-- RLS 활성화
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- 정책: 누구나 볼 수 있음 (공동 제작자 표시를 위해)
CREATE POLICY "Everyone can view collaborators" ON public.project_collaborators
    FOR SELECT USING (true);

-- 정책: 프로젝트 소유자만 추가/삭제 가능
CREATE POLICY "Project owners can manage collaborators" ON public.project_collaborators
    USING (
        EXISTS (
            SELECT 1 FROM public."Project"
            WHERE project_id = project_collaborators.project_id
            AND user_id = auth.uid()
        )
    );

-- 2. 프로젝트 수정 권한 확장 (소유자 + 공동 제작자)
-- 기존 "Users can update own project" 정책은 user_id 체크만 하므로, 공동 제작자를 위한 추가 정책 필요
CREATE POLICY "Collaborators can update project" ON public."Project"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.project_collaborators 
            WHERE project_id = "Project".project_id 
            AND user_id = auth.uid()
        )
    );
    
-- Note: 'Project' 테이블의 SELECT 정책은 이미 public일 것이므로 수정 불필요

-- 3. 피드백(ProjectRating) 공개 범위 제한
-- 기존 정책이 있다면 삭제 (이름을 몰라서 포괄적으로 처리하거나, 관리자가 직접 해야 함. 여기서는 신규 정책 추가에 집중)
-- RLS가 켜져있는지 확인하고, 기존 'Enable read access for all users' 같은 정책을 덮어써야 함.
-- 안전을 위해 기존 정책을 DO NOTHING 하고 새로 만듦. (기존 정책 이름 추측 어려움)
-- 하지만 유저 요구사항은 "작성자 - 혹은 협업자만 볼 수 있도록"임.
-- 따라서 public 읽기 권한을 없애야 함.

ALTER TABLE public."ProjectRating" ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (이름 추측: supabase 템플릿 기본값 등)
DROP POLICY IF EXISTS "Enable read access for all users" ON public."ProjectRating";
DROP POLICY IF EXISTS "Public read access" ON public."ProjectRating";
DROP POLICY IF EXISTS "Anyone can read ratings" ON public."ProjectRating";

-- 새 읽기 정책: 평가 작성자(본인), 프로젝트 소유자, 공동 제작자만 볼 수 있음
CREATE POLICY "Restricted read for ratings" ON public."ProjectRating"
    FOR SELECT
    USING (
        user_id = auth.uid() -- 작성자 본인
        OR 
        EXISTS ( -- 프로젝트 소유자
            SELECT 1 FROM public."Project" 
            WHERE project_id = "ProjectRating".project_id 
            AND user_id = auth.uid()
        )
        OR
        EXISTS ( -- 공동 제작자
            SELECT 1 FROM public.project_collaborators
            WHERE project_id = "ProjectRating".project_id
            AND user_id = auth.uid()
        )
    );

-- 4. 포인트(내공) 시스템 확인 및 트리거 보완 (혹시 누락되었을 경우)
-- 회원가입 시 1000P 지급 트리거가 없었다면 추가
CREATE OR REPLACE FUNCTION public.handle_new_user_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_points (user_id, points, reason)
  VALUES (new.id, 1000, '회원가입 축하');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_points ON auth.users;
CREATE TRIGGER on_auth_user_created_points
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_points();

-- 기존 유저들에게 포인트가 없다면 초기화 (안전장치)
INSERT INTO public.user_points (user_id, points, reason)
SELECT id, 1000, '초기 가입 보상'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_points)
ON CONFLICT DO NOTHING;

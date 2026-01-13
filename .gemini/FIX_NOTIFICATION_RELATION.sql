-- 1. notifications 테이블의 sender_id에 대한 외래 키 제약 조건 추가
-- 기존 제약 조건이 있다면 삭제 후 재생성하여 안전하게 처리
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_sender_id_fkey;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_sender_id_fkey
FOREIGN KEY (sender_id)
REFERENCES auth.users(id)
ON DELETE SET NULL; -- 사용자가 삭제되어도 알림은 남기거나, CASCADE로 삭제 선택 가능 (여기선 SET NULL)

-- 2. 만약 profiles 테이블을 참조해야 한다면 아래 주석 해제하여 사용 (보통 sender 정보를 보여주려면 profiles가 나을 수 있음)
-- 하지만 에러 메시지 상 'users'와의 관계를 찾는 것으로 보아 auth.users 혹은 public.users를 참조하려 했을 수 있음.
-- 프론트엔드에서 select('*, sender:sender_id(*)')를 호출할 때 sender_id가 가리키는 테이블의 정보를 가져옵니다.
-- 대부분의 경우 sender_id는 uuid이며 auth.users 또는 public.profiles와 연결됩니다.

-- 안전을 위해 public.profiles와의 관계도 명시적으로 설정해주면 좋습니다.
-- 다만, sender_id 컬럼 하나에 두 개의 FK를 걸 수는 없으므로,
-- 현재 sender_id가 `auth.users`를 가리키는지, `public.profiles`를 가리키는지 확인이 필요합니다.
-- 통상적으로 Supabase에서 사용자 정보조회(닉네임, 아바타 등)를 위해 join을 한다면 `public.profiles`와 연결되어야 합니다.

-- 따라서, 프론트엔드에서 닉네임 등을 가져오려 한다면 아래와 쿼리를 수정해야 합니다.
-- 기존 FK 삭제
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_sender_id_fkey;

-- profiles 테이블과 연결 (닉네임, 아바타 등을 가져오기 위함)
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_sender_id_profiles_fkey
FOREIGN KEY (sender_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- 3. 정책(RLS) 점검 (선택 사항)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 내 알림만 볼 수 있게 설정
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);


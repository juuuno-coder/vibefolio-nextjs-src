-- profiles 테이블에 누락된 interests와 expertise 컬럼을 추가합니다.
-- 이 SQL을 Supabase SQL Editor에서 실행하세요.

-- 1. profiles 테이블 확인 (혹시 이름이 다를 경우를 대비)
DO $$ 
BEGIN
    -- profiles 테이블이 존재하는지 확인
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        
        -- interests 컬럼 추가
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'interests') THEN
            ALTER TABLE public.profiles ADD COLUMN interests jsonb DEFAULT '{"genres": [], "fields": []}'::jsonb;
        END IF;

        -- expertise 컬럼 추가
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'expertise') THEN
            ALTER TABLE public.profiles ADD COLUMN expertise jsonb DEFAULT '{"fields": []}'::jsonb;
        END IF;

        -- nickname/username 동기화 (username이 닉네임 역할을 하는지 확인)
        -- profiles 테이블에 bio나 points가 없다면 추가 (types.ts 참고)
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'bio') THEN
            ALTER TABLE public.profiles ADD COLUMN bio text DEFAULT '';
        END IF;

        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'points') THEN
            ALTER TABLE public.profiles ADD COLUMN points integer DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'profile_image_url') THEN
            ALTER TABLE public.profiles ADD COLUMN profile_image_url text DEFAULT '';
        END IF;

    ELSE
        -- 만약 profiles 테이블이 없고 users 테이블이 있다면 (이전 스키마 호환성)
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'expertise') THEN
                ALTER TABLE public.users ADD COLUMN expertise jsonb DEFAULT '{"fields": []}'::jsonb;
            END IF;
        END IF;
    END IF;
END $$;

-- 2. 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';

-- 3. 확인용 조회
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles';

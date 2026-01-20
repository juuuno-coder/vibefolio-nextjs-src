
-- Function to handle new user registration: Welcome Noti + Signup Bonus
CREATE OR REPLACE FUNCTION public.handle_new_user_welcome()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. 환영 메시지
    INSERT INTO public.notifications (user_id, type, title, message, link, read)
    VALUES (
        NEW.id,
        'system',
        'Vibefolio에 오신 것을 환영합니다! 🎉',
        '나만의 포트폴리오를 만들고 전 세계 크리에이터들과 소통해보세요.',
        '/mypage/profile',
        false
    );

    -- 2. 첫 게시물 등록 독려
    INSERT INTO public.notifications (user_id, type, title, message, link, read)
    VALUES (
        NEW.id,
        'system',
        '첫 게시물을 등록해보세요! 🚀',
        '멋진 작업물을 공유하고 피드백을 받아보세요.',
        '/project/upload',
        false
    );

    -- [New] 3. 회원가입 보상 지급 (1000 Point)
    -- 프로필이 이미 생성되어 있어야 함 (보통 Trigge 순서에 따라 다르지만, handle_new_user와 통합하는게 좋음)
    -- 만약 public.handle_new_user() 트리거가 먼저 돌아서 profiles를 만든다면 여기서 update 가능.
    -- 안전을 위해 profiles가 있으면 업데이트.
    
    UPDATE public.profiles
    SET points = COALESCE(points, 0) + 1000
    WHERE id = NEW.id;

    -- [New] 4. 포인트 로그 기록
    INSERT INTO public.point_logs (user_id, amount, reason)
    VALUES (NEW.id, 1000, '회원가입 축하금 🎉');

    -- [New] 5. 포인트 지급 알림
    INSERT INTO public.notifications (user_id, type, title, message, link, read)
    VALUES (
        NEW.id, 
        'point', 
        '회원가입 축하금 지급! 💰', 
        'Vibefolio의 회원이 되신 것을 환영합니다! 1,000 내공이 지급되었습니다.', 
        '/mypage', 
        false
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger는 기존과 동일하게 auth.users에 걸려있으므로 함수만 교체되면 자동 적용됨 (CREATE OR REPLACE)

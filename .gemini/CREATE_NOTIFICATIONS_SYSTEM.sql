-- =========================================================
-- CREATE NOTIFICATIONS SYSTEM
-- =========================================================

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- 수신자
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,     -- 발신자 (옵션)
    type VARCHAR(20) NOT NULL, -- 'like', 'comment', 'follow', 'mention', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link VARCHAR(500),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB -- 추가 데이터 (project_id 등)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own notifications' AND tablename = 'notifications') THEN
        CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own notifications' AND tablename = 'notifications') THEN
        CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    -- Insert policy (System or Trigger usually handles this, but allow authenticated for client-side triggers if needed)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert notifications' AND tablename = 'notifications') THEN
        CREATE POLICY "Authenticated users can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;


-- 2. Trigger Function: Send Notification on Like
CREATE OR REPLACE FUNCTION public.handle_new_like()
RETURNS TRIGGER AS $$
DECLARE
    project_owner_id UUID;
    project_title TEXT;
    sender_name TEXT;
BEGIN
    -- 1. Get Project Owner & Title
    SELECT user_id, title INTO project_owner_id, project_title
    FROM public."Project"
    WHERE project_id = NEW.project_id;

    -- 2. Get Sender (Liker) Name
    SELECT username INTO sender_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Fallback name
    IF sender_name IS NULL THEN
        sender_name := '누군가';
    END IF;

    -- 3. Avoid self-notification
    IF project_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, sender_id, type, title, message, link, metadata)
        VALUES (
            project_owner_id,
            NEW.user_id,
            'like',
            '❤️ 프로젝트 좋아요',
            sender_name || '님이 회원님의 프로젝트를 좋아합니다.',
            '/project/' || NEW.project_id,
            jsonb_build_object('project_id', NEW.project_id)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach Trigger to "Like" table
DROP TRIGGER IF EXISTS on_like_created ON public."Like";
CREATE TRIGGER on_like_created
    AFTER INSERT ON public."Like"
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_like();


-- 4. Trigger Function: Send Notification on Comment (Bonus)
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER AS $$
DECLARE
    project_owner_id UUID;
    project_title TEXT;
    sender_name TEXT;
BEGIN
    SELECT user_id, title INTO project_owner_id, project_title
    FROM public."Project"
    WHERE project_id = NEW.project_id;

    SELECT username INTO sender_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    IF sender_name IS NULL THEN sender_name := '누군가'; END IF;

    -- Self-comment check
    IF project_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, sender_id, type, title, message, link, metadata)
        VALUES (
            project_owner_id,
            NEW.user_id,
            'comment',
            '💬 새 댓글 달림',
            sender_name || '님이 댓글을 남겼습니다: ' || LEFT(NEW.content, 20),
            '/project/' || NEW.project_id,
            jsonb_build_object('project_id', NEW.project_id, 'comment_id', NEW.comment_id)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Trigger to "Comment" table
DROP TRIGGER IF EXISTS on_comment_created ON public."Comment";
CREATE TRIGGER on_comment_created
    AFTER INSERT ON public."Comment"
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_comment();

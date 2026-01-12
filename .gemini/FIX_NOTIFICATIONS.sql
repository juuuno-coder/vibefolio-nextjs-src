-- =========================================================
-- FIX NOTIFICATIONS TRIGGER AND POLICIES
-- =========================================================

-- 1. Ensure RLS policies are correct for real-time
-- Notifications table needs to be selectable by the user to receive real-time updates
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Debugging: Check triggers
-- Re-create the handle_new_like function with extra logging (if possible, or just simpler logic)
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
        sender_name := '알 수 없는 사용자';
    END IF;

    -- 3. Avoid self-notification
    -- Important: Insert into notifications table
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

-- Re-create the trigger just in case
DROP TRIGGER IF EXISTS on_like_created ON public."Like";
CREATE TRIGGER on_like_created
    AFTER INSERT ON public."Like"
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_like();


-- 3. Comment Trigger Fix (Same logic)
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
    
    IF sender_name IS NULL THEN sender_name := '알 수 없는 사용자'; END IF;

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

DROP TRIGGER IF EXISTS on_comment_created ON public."Comment";
CREATE TRIGGER on_comment_created
    AFTER INSERT ON public."Comment"
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_comment();

-- 4. Enable Realtime ONLY for notifications table if not already enabled via dashboard
-- Note: Realtime setup usually requires dashboard configuration, but we can try setting REPLICA IDENTITY
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

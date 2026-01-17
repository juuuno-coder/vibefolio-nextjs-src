
-- Drop existing function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.request_project_feedback;

-- Create correct function utilizing 'points' column
CREATE OR REPLACE FUNCTION public.request_project_feedback(
  p_project_id BIGINT,
  p_user_id UUID,
  p_cost INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_points INTEGER;
BEGIN
  -- 1. Get current points
  SELECT points INTO v_current_points
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_current_points IS NULL THEN
      v_current_points := 0;
  END IF;

  -- 2. Check balance
  IF v_current_points < p_cost THEN
      RETURN jsonb_build_object(
          'success', false,
          'message', '내공이 부족합니다.'
      );
  END IF;

  -- 3. Deduct points
  UPDATE public.profiles
  SET points = points - p_cost
  WHERE id = p_user_id;

  -- 4. Log transaction
  INSERT INTO public.point_logs (user_id, amount, reason)
  VALUES (p_user_id, -p_cost, '피드백 요청 (프로젝트 프로모션)');

  -- 5. Update Project custom_data
  -- Use jsonb_set to update or add 'is_feedback_requested' property
  UPDATE "Project"
  SET custom_data = 
    CASE 
      WHEN custom_data IS NULL THEN jsonb_build_object('is_feedback_requested', true)
      ELSE custom_data || '{"is_feedback_requested": true}'::jsonb
    END
  WHERE project_id = p_project_id;

  RETURN jsonb_build_object(
      'success', true,
      'message', '성공적으로 처리되었습니다.',
      'remaining_points', v_current_points - p_cost
  );
END;
$$;

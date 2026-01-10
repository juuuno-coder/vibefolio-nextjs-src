-- 방문자 수 증가 함수 (Upsert 로직 포함)
-- 이 함수는 특정 날짜의 방문자 수를 1 증가시키거나, 해당 날짜 행이 없으면 새로 생성합니다.

CREATE OR REPLACE FUNCTION increment_daily_visits(target_date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- 정의한 사람(관리자)의 권한으로 실행 (RLS 우회 가능)
AS $$
BEGIN
  INSERT INTO site_stats (date, visits, page_views)
  VALUES (target_date, 1, 1)
  ON CONFLICT (date)
  DO UPDATE SET
    visits = site_stats.visits + 1,
    page_views = site_stats.page_views + 1;
END;
$$;

-- 일별 방문자 집계 함수 (Upsert 방식)
CREATE OR REPLACE FUNCTION increment_daily_visits(target_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO site_stats (date, visits)
  VALUES (target_date, 1)
  ON CONFLICT (date)
  DO UPDATE SET visits = site_stats.visits + 1;
END;
$$ LANGUAGE plpgsql;

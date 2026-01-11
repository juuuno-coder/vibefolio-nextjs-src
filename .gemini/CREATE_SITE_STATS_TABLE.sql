-- 방문자 통계 요약 테이블 (일별 집계용)
CREATE TABLE IF NOT EXISTS site_stats (
    date DATE PRIMARY KEY,
    visits INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0
);

-- RLS 설정
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

-- 누구나 읽을 수 있음 (필요하다면 관리자만)
CREATE POLICY "Allow select for everyone" ON site_stats FOR SELECT USING (true);

-- 인서트는 함수(RPC)를 통해서만 이루어지므로, 일반적인 Insert 정책은 닫아둘 수 있으나,
-- 개발 편의상 서비스 롤에서 접근 가능하게 둠 (RPC는 Security Definer로 보통 작성)
-- 여기서는 postgres 함수 권한으로 처리되므로 테이블 정책은 관리자 OR 서비스 롤에 대해서만 엽니다.
CREATE POLICY "Allow all for admin" ON site_stats FOR ALL USING (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
);

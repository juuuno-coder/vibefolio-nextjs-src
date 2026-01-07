-- recruit_items 테이블 생성
CREATE TABLE IF NOT EXISTS recruit_items (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('job', 'contest', 'event')),
  date DATE NOT NULL,
  location TEXT,
  prize TEXT,
  salary TEXT,
  company TEXT,
  employment_type TEXT,
  link TEXT,
  thumbnail TEXT,
  
  -- 크롤링 관련 필드
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  crawled_at TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES auth.users(id),
  
  -- 메타데이터
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_recruit_items_type ON recruit_items(type);
CREATE INDEX IF NOT EXISTS idx_recruit_items_date ON recruit_items(date);
CREATE INDEX IF NOT EXISTS idx_recruit_items_approved ON recruit_items(is_approved, is_active);
CREATE INDEX IF NOT EXISTS idx_recruit_items_active ON recruit_items(is_active) WHERE is_active = true;

-- RLS (Row Level Security) 정책
ALTER TABLE recruit_items ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 승인된 활성 항목 조회 가능
CREATE POLICY "Anyone can view approved active items"
  ON recruit_items FOR SELECT
  USING (is_approved = true AND is_active = true);

-- 관리자만 모든 항목 조회 가능
CREATE POLICY "Admins can view all items"
  ON recruit_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 관리자만 생성/수정/삭제 가능
CREATE POLICY "Admins can insert items"
  ON recruit_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update items"
  ON recruit_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete items"
  ON recruit_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recruit_items_updated_at
  BEFORE UPDATE ON recruit_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

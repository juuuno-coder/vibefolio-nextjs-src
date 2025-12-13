-- ===================================
-- 컬렉션 기능을 위한 테이블 생성
-- Supabase SQL Editor에서 실행하세요
-- ===================================

-- 1. Collection 테이블 생성
CREATE TABLE IF NOT EXISTS "Collection" (
  collection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CollectionItem 테이블 생성
CREATE TABLE IF NOT EXISTS "CollectionItem" (
  collection_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES "Collection"(collection_id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES "Project"(project_id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, project_id)
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_collection_user_id ON "Collection"(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_item_collection_id ON "CollectionItem"(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_item_project_id ON "CollectionItem"(project_id);

-- 4. RLS 활성화
ALTER TABLE "Collection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CollectionItem" ENABLE ROW LEVEL SECURITY;

-- 5. Collection RLS 정책
DROP POLICY IF EXISTS "Users can view their own collections" ON "Collection";
CREATE POLICY "Users can view their own collections"
  ON "Collection" FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can create their own collections" ON "Collection";
CREATE POLICY "Users can create their own collections"
  ON "Collection" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own collections" ON "Collection";
CREATE POLICY "Users can update their own collections"
  ON "Collection" FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own collections" ON "Collection";
CREATE POLICY "Users can delete their own collections"
  ON "Collection" FOR DELETE
  USING (auth.uid() = user_id);

-- 6. CollectionItem RLS 정책
DROP POLICY IF EXISTS "Users can view items in their collections" ON "CollectionItem";
CREATE POLICY "Users can view items in their collections"
  ON "CollectionItem" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Collection"
      WHERE collection_id = "CollectionItem".collection_id
      AND (user_id = auth.uid() OR is_public = true)
    )
  );

DROP POLICY IF EXISTS "Users can add items to their collections" ON "CollectionItem";
CREATE POLICY "Users can add items to their collections"
  ON "CollectionItem" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Collection"
      WHERE collection_id = "CollectionItem".collection_id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can remove items from their collections" ON "CollectionItem";
CREATE POLICY "Users can remove items from their collections"
  ON "CollectionItem" FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "Collection"
      WHERE collection_id = "CollectionItem".collection_id
      AND user_id = auth.uid()
    )
  );

-- 완료 메시지
SELECT 'Collection 테이블 및 RLS 정책이 성공적으로 생성되었습니다!' as message;

-- =================================================================
-- VIBEFOLIO Performance Optimization Script (Final Fixes 2)
-- =================================================================
-- Description: This script creates indexes for frequently used Foreign Keys 
-- and sorting columns to improve query performance.
-- Author: Antigravity
-- =================================================================

-- 1. Project Table Optimization
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_project_user_id ON "Project" (user_id);
CREATE INDEX IF NOT EXISTS idx_project_category_id ON "Project" (category_id);
CREATE INDEX IF NOT EXISTS idx_project_created_at ON "Project" (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_views_count ON "Project" (views_count DESC);
CREATE INDEX IF NOT EXISTS idx_project_likes_count ON "Project" (likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_project_visibility ON "Project" (visibility);

-- 2. Project Rating (Evaluations) Optimization
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_rating_project_id ON "ProjectRating" (project_id);
CREATE INDEX IF NOT EXISTS idx_rating_user_id ON "ProjectRating" (user_id);
CREATE INDEX IF NOT EXISTS idx_rating_created_at ON "ProjectRating" (created_at DESC);

-- 3. Likes Optimization (Table Name: "Like" - Singular, Quoted)
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_likes_project_user ON "Like" (project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON "Like" (user_id);
CREATE INDEX IF NOT EXISTS idx_likes_project_id ON "Like" (project_id);

-- 4. Comments Optimization (Table Name: "Comment" - Singular)
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON "Comment" (project_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON "Comment" (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON "Comment" (created_at ASC);

-- 5. Notifications Optimization (Lowercase 'notifications')
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON "notifications" (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON "notifications" (user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON "notifications" (created_at DESC);

-- 6. Visit Logs (Analytics) Optimization
-- -------------------------------------------------------------
-- Note: In step 1712, src/app/admin/stats/page.tsx sorts visit_logs by 'visited_at'
-- .order('visited_at', { ascending: false })
-- So the column name is 'visited_at', not 'created_at'.
-- If 'visited_at' also fails, please comment out this section.
CREATE INDEX IF NOT EXISTS idx_visit_logs_visited_at ON "visit_logs" (visited_at DESC);

-- 7. Collection Items Optimization (CamelCase 'CollectionItem')
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_collection_items_Project ON "CollectionItem" (project_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_Collection ON "CollectionItem" (collection_id);

-- =================================================================
-- Note: Run this script in your Supabase SQL Editor.
-- =================================================================

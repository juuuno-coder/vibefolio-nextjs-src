-- 1. Comment 테이블에 비밀글 여부 컬럼 추가
ALTER TABLE "Comment" 
ADD COLUMN is_secret BOOLEAN DEFAULT FALSE;

-- 2. (선택사항) 투표 기능을 위한 테이블 생성
CREATE TABLE "ProjectPoll" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES "Project"(project_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(50) NOT NULL, -- 'launch_now', 'develop_more', 'need_research'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(project_id, user_id) -- 한 프로젝트당 한 번만 투표 가능
);

-- 3. (선택사항) 피드백 모드 설정 (Project 테이블에 추가)
ALTER TABLE "Project"
ADD COLUMN feedback_mode VARCHAR(20) DEFAULT 'general'; 
-- 'general', 'michelin', 'poll', 'business'

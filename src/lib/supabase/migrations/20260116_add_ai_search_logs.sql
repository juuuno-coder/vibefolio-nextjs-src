-- Create a table for AI Opportunity Search logs
CREATE TABLE IF NOT EXISTS public.ai_search_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    items_found INTEGER DEFAULT 0,
    search_type TEXT DEFAULT 'opportunity' -- 'opportunity', 'portfolio', etc.
);

-- Index for faster query on user history and trends
CREATE INDEX IF NOT EXISTS idx_ai_search_logs_user_id ON public.ai_search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_search_logs_created_at ON public.ai_search_logs(created_at);

-- RLS Policies
ALTER TABLE public.ai_search_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own logs
CREATE POLICY "Users can view their own search logs" 
ON public.ai_search_logs FOR SELECT 
USING (auth.uid() = user_id);

-- System creates logs (or user on client side if permitted, but better from server API)
-- Let's allow insert for authenticated users
CREATE POLICY "Users can insert their own search logs" 
ON public.ai_search_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Grant access
GRANT SELECT, INSERT ON public.ai_search_logs TO authenticated;

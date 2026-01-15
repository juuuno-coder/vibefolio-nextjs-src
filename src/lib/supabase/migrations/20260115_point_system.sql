-- Add points column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Create point_logs table to track history
CREATE TABLE IF NOT EXISTS public.point_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_point_logs_user_id ON public.point_logs(user_id);

-- Optional: Add RLS policies if needed, but we modify via Admin Client for now
ALTER TABLE public.point_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own point logs" ON public.point_logs
    FOR SELECT USING (auth.uid() = user_id);

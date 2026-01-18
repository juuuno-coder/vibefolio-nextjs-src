-- Create AI Chat Sessions table
create table if not exists public.ai_chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tool_type text not null, -- 'opportunity', 'persona', 'assistant', 'lean-canvas'
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create AI Chat Messages table
create table if not exists public.ai_chat_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.ai_chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text,
  tool_data jsonb, -- To store structured results (e.g., job lists, search results)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.ai_chat_sessions enable row level security;
alter table public.ai_chat_messages enable row level security;

create policy "Users can view their own chat sessions"
  on public.ai_chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own chat sessions"
  on public.ai_chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own chat sessions"
  on public.ai_chat_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own chat sessions"
  on public.ai_chat_sessions for delete
  using (auth.uid() = user_id);

create policy "Users can view messages of their own sessions"
  on public.ai_chat_messages for select
  using (
    exists (
      select 1 from public.ai_chat_sessions
      where id = ai_chat_messages.session_id
      and user_id = auth.uid()
    )
  );

create policy "Users can insert messages to their own sessions"
  on public.ai_chat_messages for insert
  with check (
    exists (
      select 1 from public.ai_chat_sessions
      where id = ai_chat_messages.session_id
      and user_id = auth.uid()
    )
  );

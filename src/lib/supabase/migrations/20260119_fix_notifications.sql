
-- 1. Setup Realtime (Idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;

-- 2. Enable RLS
alter table public.notifications enable row level security;

-- 3. Drop ALL existing policies to prevent "already exists" errors
-- (Even if they don't exist, these commands won't fail)
drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Users can insert notifications for themselves" on public.notifications;
drop policy if exists "Enable insert for authenticated users" on public.notifications;
drop policy if exists "Users can update their own notifications" on public.notifications;

-- 4. Re-create Policies

-- Allow users to view their own notifications
create policy "Users can view their own notifications"
on public.notifications for select
using (auth.uid() = user_id);

-- Allow authenticated users to insert notifications (Used for Test Button & Client-side logic)
create policy "Enable insert for authenticated users"
on public.notifications for insert
to authenticated
with check (true); 

-- Allow users to update "read" status of their own notifications
create policy "Users can update their own notifications"
on public.notifications for update
using (auth.uid() = user_id);

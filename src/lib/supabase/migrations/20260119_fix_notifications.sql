
-- 1. Ensure 'notifications' table is in the 'supabase_realtime' publication
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

-- 3. Policy for specific access control

-- Drop existing policies to avoid conflicts (optional/safe logic)
drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Enable insert for authenticated users" on public.notifications;

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

-- Create site_config table for global settings
create table if not exists site_config (
  key text primary key,
  value text,
  description text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table site_config enable row level security;

-- Policies
create policy "Enable read access for all users" on site_config
  for select using (true);

create policy "Enable update for admins only" on site_config
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Enable insert for admins only" on site_config
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Initialize default SEO settings
insert into site_config (key, value, description)
values 
  ('seo_og_image', '', 'Open Graph share image URL'),
  ('seo_title', 'Vibefolio - 크리에이터를 위한 영감 저장소', 'Global site title'),
  ('seo_description', '디자이너, 개발자, 기획자를 위한 프로젝트 아카이빙 및 레퍼런스 공유 플랫폼', 'Global site description')
on conflict (key) do nothing;

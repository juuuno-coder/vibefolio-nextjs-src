-- Helper function to get user role from profiles table
CREATE OR REPLACE FUNCTION get_user_role(user_id_input UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id_input;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Banners Table RLS Policies
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.banners;
CREATE POLICY "Allow public read access" ON public.banners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin write access" ON public.banners;
CREATE POLICY "Allow admin write access" ON public.banners FOR ALL
USING (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
WITH CHECK (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin');

-- 2. Popups Table RLS Policies
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.popups;
CREATE POLICY "Allow public read access" ON public.popups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin write access" ON public.popups;
CREATE POLICY "Allow admin write access" ON public.popups FOR ALL
USING (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
WITH CHECK (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin');

-- 3. Job Postings Table RLS Policies
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.job_postings;
CREATE POLICY "Allow public read access" ON public.job_postings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin write access" ON public.job_postings;
CREATE POLICY "Allow admin write access" ON public.job_postings FOR ALL
USING (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
WITH CHECK (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin');

-- 4. Profiles Table RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.profiles;
CREATE POLICY "Allow public read access" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Projects Table RLS Policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.projects;
CREATE POLICY "Allow public read access" ON public.projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow users to manage their own projects" ON public.projects;
CREATE POLICY "Allow users to manage their own projects" ON public.projects FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Proposals Table RLS Policies
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.proposals;
CREATE POLICY "Allow public read access" ON public.proposals FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow users to manage their own proposals" ON public.proposals;
CREATE POLICY "Allow users to manage their own proposals" ON public.proposals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. Follows Table RLS Policies
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.follows;
CREATE POLICY "Allow public read access" ON public.follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow users to manage their own follows" ON public.follows;
CREATE POLICY "Allow users to manage their own follows" ON public.follows FOR ALL
USING (auth.uid() = follower_id)
WITH CHECK (auth.uid() = follower_id);

-- 8. Comments Table RLS Policies
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.comments;
CREATE POLICY "Allow public read access" ON public.comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow users to manage their own comments" ON public.comments;
CREATE POLICY "Allow users to manage their own comments" ON public.comments FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 9. Likes Table RLS Policies
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.likes;
CREATE POLICY "Allow public read access" ON public.likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow users to manage their own likes" ON public.likes;
CREATE POLICY "Allow users to manage their own likes" ON public.likes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 10. Bookmarks Table RLS Policies
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.bookmarks;
CREATE POLICY "Allow public read access" ON public.bookmarks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow users to manage their own bookmarks" ON public.bookmarks;
CREATE POLICY "Allow users to manage their own bookmarks" ON public.bookmarks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 11. Views Table RLS Policies
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.views;
CREATE POLICY "Allow public read access" ON public.views FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow users to insert views" ON public.views;
CREATE POLICY "Allow users to insert views" ON public.views FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 12. Inquiries Table RLS Policies
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admins all access to inquiries" ON public.inquiries;
CREATE POLICY "Allow admins all access to inquiries" ON public.inquiries
  FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Allow users to view their own inquiries" ON public.inquiries;
CREATE POLICY "Allow users to view their own inquiries" ON public.inquiries
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to create inquiries" ON public.inquiries;
CREATE POLICY "Allow users to create inquiries" ON public.inquiries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete their own inquiries" ON public.inquiries;
CREATE POLICY "Allow users to delete their own inquiries" ON public.inquiries
  FOR DELETE
  USING (auth.uid() = user_id);

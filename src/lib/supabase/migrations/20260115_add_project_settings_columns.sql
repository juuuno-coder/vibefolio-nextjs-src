-- Add missing columns to Project table for Editor Settings
-- Supporting both "Project" and "projects" case conventions to be safe

DO $$ 
BEGIN 
    -- Check if 'projects' table exists and add columns
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
        ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "allow_michelin_rating" BOOLEAN DEFAULT true;
        ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "allow_stickers" BOOLEAN DEFAULT true;
        ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "allow_secret_comments" BOOLEAN DEFAULT true;
        ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "description" TEXT;
    END IF;

    -- Check if 'Project' table exists and add columns
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Project') THEN
        ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "allow_michelin_rating" BOOLEAN DEFAULT true;
        ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "allow_stickers" BOOLEAN DEFAULT true;
        ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "allow_secret_comments" BOOLEAN DEFAULT true;
        ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "description" TEXT;
    END IF;
END $$;

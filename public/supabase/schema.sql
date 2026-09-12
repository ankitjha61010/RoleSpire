-- ==============================================================================
-- RoleSpire Platform: Complete Supabase Production Database Schema
-- Run this in your Supabase SQL Editor to set up tables, RLS, and security
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('saved', 'applied', 'assessment', 'interview', 'offer', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE remote_type AS ENUM ('remote', 'hybrid', 'onsite');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE employment_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    headline TEXT DEFAULT 'Software Engineer',
    bio TEXT,
    experience_years NUMERIC(4, 1) DEFAULT 3.0,
    current_location TEXT DEFAULT 'Ahmedabad, India',
    preferred_locations TEXT[] DEFAULT ARRAY['Ahmedabad', 'Bangalore', 'Remote'],
    expected_salary_min INTEGER DEFAULT 1200000,
    expected_salary_currency TEXT DEFAULT 'INR',
    remote_preference TEXT DEFAULT 'open', -- 'remote_only', 'hybrid', 'onsite', 'open'
    resume_url TEXT,
    theme_preference TEXT DEFAULT 'dark',
    accent_theme TEXT DEFAULT 'default', -- 'default', 'ocean', 'forest', 'sunset', 'midnight'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USER SKILLS
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    years_of_experience NUMERIC(3, 1) DEFAULT 1.0,
    proficiency TEXT DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'expert'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

-- 5. JOBS TABLE (Public directory / Cached Aggregator listings)
CREATE TABLE IF NOT EXISTS public.jobs (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL DEFAULT 'direct', -- company admins post jobs directly; no third-party job boards
    source_job_id TEXT,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    company_logo TEXT,
    company_domain TEXT,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[] DEFAULT ARRAY[]::TEXT[],
    benefits TEXT[] DEFAULT ARRAY[]::TEXT[],
    salary_min INTEGER,
    salary_max INTEGER,
    currency TEXT DEFAULT 'INR',
    employment_type TEXT DEFAULT 'full-time',
    remote_type TEXT DEFAULT 'remote',
    skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    experience_level TEXT DEFAULT 'Mid-Level',
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    apply_url TEXT NOT NULL,
    application_type TEXT DEFAULT 'external', -- 'direct', 'external'
    is_active BOOLEAN DEFAULT TRUE,
    quality_score INTEGER DEFAULT 85,
    duplicate_cluster_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CUSTOM FOLDERS
CREATE TABLE IF NOT EXISTS public.custom_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT 'folder',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- 7. SAVED JOBS
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES public.custom_folders(id) ON DELETE SET NULL,
    folder_type TEXT DEFAULT 'saved', -- 'saved', 'dream_jobs', 'apply_later', 'high_priority', 'custom'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- 8. APPLICATIONS (Kanban Tracker)
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id TEXT REFERENCES public.jobs(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    status application_status DEFAULT 'applied',
    location TEXT,
    salary_offered TEXT,
    contact_person TEXT,
    contact_email TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    interview_date TIMESTAMPTZ,
    follow_up_date TIMESTAMPTZ,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    match_score INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. APPLICATION EVENTS & TIMELINE
CREATE TABLE IF NOT EXISTS public.application_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'applied', 'screening', 'technical_interview', 'assessment', 'hr_interview', 'offer_received', 'rejected', 'note_added'
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. JOB ALERTS
CREATE TABLE IF NOT EXISTS public.job_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    location TEXT,
    remote_only BOOLEAN DEFAULT FALSE,
    min_salary INTEGER,
    frequency TEXT DEFAULT 'daily', -- 'instant', 'daily', 'weekly'
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User skills policies
CREATE POLICY "Users can manage own skills" ON public.user_skills FOR ALL USING (auth.uid() = user_id);

-- Jobs policies (Public read, authenticated insert/update)
CREATE POLICY "Anyone can read active jobs" ON public.jobs FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can insert jobs" ON public.jobs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Custom folders policies
CREATE POLICY "Users can manage own folders" ON public.custom_folders FOR ALL USING (auth.uid() = user_id);

-- Saved jobs policies
CREATE POLICY "Users can manage own saved jobs" ON public.saved_jobs FOR ALL USING (auth.uid() = user_id);

-- Applications policies
CREATE POLICY "Users can manage own applications" ON public.applications FOR ALL USING (auth.uid() = user_id);

-- Application events policies
CREATE POLICY "Users can manage own application events" ON public.application_events FOR ALL USING (auth.uid() = user_id);

-- Job alerts policies
CREATE POLICY "Users can manage own job alerts" ON public.job_alerts FOR ALL USING (auth.uid() = user_id);

-- 12. AUTOMATIC PROFILE CREATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_jobs_location ON public.jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_remote_type ON public.jobs(remote_type);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON public.jobs(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON public.saved_jobs(user_id);

-- ==============================================================================
-- 13. PUBLIC PEOPLE SEARCH
-- The base `profiles` table stays locked to "view own row only" (see policy
-- above) — email, salary expectations, resume, bio, and location never leave
-- a user's own session. This adds a narrow, additive view so signed-in users
-- can find each other by name, exposing ONLY name/headline/company/avatar.
-- ==============================================================================

-- The `company` field is part of the app's profile form but had no column yet.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company TEXT;

-- Views run with their owner's privileges by default (not the querying
-- user's), so this deliberately does NOT set security_invoker — that's what
-- lets it read across all rows despite the strict per-user RLS policy on the
-- underlying table, while only ever exposing these four columns.
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, full_name, headline, company, avatar_url
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;

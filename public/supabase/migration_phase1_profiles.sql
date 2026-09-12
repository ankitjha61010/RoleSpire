-- ==============================================================================
-- RoleSpire Platform: Phase 1 migration — companies skeleton + real profile depth
-- (experience, education, certifications, projects) + public directory fixes.
-- Run this in the Supabase SQL Editor (or via psql) after schema.sql.
-- ==============================================================================

-- 1. COMPANIES (skeleton now; jobs/posts attach to these from Phase 6/2)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    cover_image_url TEXT,
    industry TEXT,
    hq_location TEXT,
    website TEXT,
    about TEXT,
    company_size TEXT,
    founded_year INTEGER,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.company_members (
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (company_id, user_id)
);

-- 2. PROFILE DEPTH
-- `company` (free text) already exists (schema.sql) and stays as a fallback for
-- an employer not yet in `companies`; `company_id` is the real FK once linked.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'job_seeker';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badge_status TEXT DEFAULT 'none';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public';

CREATE TABLE IF NOT EXISTS public.experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    location TEXT,
    employment_type TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_name TEXT NOT NULL,
    degree TEXT,
    field_of_study TEXT,
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    issuing_org TEXT,
    issue_date DATE,
    credential_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    url TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ROW LEVEL SECURITY
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated members read companies" ON public.companies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users create companies" ON public.companies FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Company admins update company" ON public.companies FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = id AND m.user_id = auth.uid() AND m.role = 'admin')
);

-- Whoever creates a company automatically becomes its first admin.
CREATE OR REPLACE FUNCTION public.add_company_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.company_members (company_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin')
    ON CONFLICT (company_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_company_created ON public.companies;
CREATE TRIGGER on_company_created
    AFTER INSERT ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.add_company_creator_as_admin();

CREATE POLICY "Authenticated members read company members" ON public.company_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Company admins manage members" ON public.company_members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = company_members.company_id AND m.user_id = auth.uid() AND m.role = 'admin')
);

-- Experience/education/certifications/projects: readable by any signed-in
-- member (public resume-style info), writable only by the owner.
CREATE POLICY "Authenticated members read experiences" ON public.experiences FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users manage own experiences" ON public.experiences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated members read education" ON public.education FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users manage own education" ON public.education FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated members read certifications" ON public.certifications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users manage own certifications" ON public.certifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated members read projects" ON public.projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- `user_skills` (schema.sql) only ever allowed the owner to read their own
-- rows (`FOR ALL USING (auth.uid() = user_id)`), which blocks showing a
-- *different* member's skills on their public profile page. Add a narrow
-- read policy alongside the existing one — Postgres OR's applicable RLS
-- policies together, so this only widens SELECT; writes stay owner-only via
-- the pre-existing ALL policy.
CREATE POLICY "Authenticated members read skills" ON public.user_skills FOR SELECT USING (auth.role() = 'authenticated');

-- 4. DIRECTORY VIEWS
-- Extend the public directory with the new public-safe columns, and open it to
-- `anon` too — People search must work even for a browser that isn't in a real
-- authenticated Supabase session (the "can't find ankit" bug). Email, salary
-- expectations, resume, and preferred locations never appear here regardless
-- of `profile_visibility` — those stay genuinely private. `bio`/`current_location`
-- /`experience_years`/`social_links` are shown unless the user sets their
-- profile to 'private' (see the profile_visibility column added above).
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
    id, full_name, headline, company, company_id, avatar_url, cover_image_url,
    role, badge_status, profile_visibility,
    CASE WHEN profile_visibility = 'private' THEN NULL ELSE bio END AS bio,
    CASE WHEN profile_visibility = 'private' THEN NULL ELSE current_location END AS current_location,
    CASE WHEN profile_visibility = 'private' THEN NULL ELSE experience_years END AS experience_years,
    CASE WHEN profile_visibility = 'private' THEN NULL ELSE social_links END AS social_links
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated, anon;

CREATE OR REPLACE VIEW public.public_companies AS
SELECT id, slug, name, logo_url, cover_image_url, industry, hq_location, website, about, company_size, founded_year
FROM public.companies;

GRANT SELECT ON public.public_companies TO authenticated, anon;

-- 5. STORAGE: avatar/cover-image uploads (mirrors the existing `resumes`
-- bucket pattern — path is always `${userId}/...`, so folder-based RLS can
-- restrict writes to the owner while keeping images publicly viewable).
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-media', 'profile-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read profile media" ON storage.objects FOR SELECT USING (bucket_id = 'profile-media');
CREATE POLICY "Users upload own profile media" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users update own profile media" ON storage.objects FOR UPDATE USING (
    bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users delete own profile media" ON storage.objects FOR DELETE USING (
    bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_experiences_user_id ON public.experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_education_user_id ON public.education(user_id);
CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON public.certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- ==============================================================================
-- RoleSpire Platform: Phase 7 migration — company pages & admin membership.
-- Lets any signed-in user register their employer as a company page (like a
-- LinkedIn company page), manage its profile, and post jobs under it.
-- Run this after migration_phase1_profiles.sql and migration_phase6_jobs.sql.
-- ==============================================================================

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
    role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'member'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (company_id, user_id)
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Company profiles are public, like a LinkedIn company page.
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Signed-in users can register a company" ON public.companies FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Company admins can update their company" ON public.companies FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = companies.id AND m.user_id = auth.uid() AND m.role = 'admin')
);

-- Membership rows carry no sensitive data (just who admins/works a public page),
-- so any signed-in user can read them — needed to show member counts and the
-- "You're an admin" badge on any company's page.
CREATE POLICY "Members are readable by signed-in users" ON public.company_members FOR SELECT USING (auth.role() = 'authenticated');

-- Auto-add the registrant as the company's first admin the moment it's created
-- (mirrors the handle_new_user() pattern in schema.sql — SECURITY DEFINER lets
-- this insert succeed even though no direct INSERT policy exists for regular
-- users on company_members).
CREATE OR REPLACE FUNCTION public.handle_new_company()
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
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_company();

-- Keep `updated_at` current on every edit
CREATE OR REPLACE FUNCTION public.handle_company_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_company_updated ON public.companies;
CREATE TRIGGER on_company_updated
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.handle_company_updated_at();

-- Read-facing view used by the company page (kept consistent with the
-- public_profiles pattern used for people search).
CREATE OR REPLACE VIEW public.public_companies AS
SELECT id, slug, name, logo_url, cover_image_url, industry, hq_location, website, about, company_size, founded_year, created_at, updated_at
FROM public.companies;

GRANT SELECT ON public.public_companies TO authenticated;

CREATE INDEX IF NOT EXISTS idx_companies_created_by ON public.companies(created_by);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON public.company_members(user_id);

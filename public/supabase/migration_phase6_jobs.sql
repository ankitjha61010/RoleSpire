-- ==============================================================================
-- RoleSpire Platform: Phase 6 migration — jobs sourced only from our own DB.
-- Job listings no longer come from Adzuna/Remotive/Arbeitnow; company admins
-- post directly into `public.jobs` (already defined in schema.sql).
-- Run this in the Supabase SQL Editor (or via psql) after migration_phase1_profiles.sql.
-- ==============================================================================

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS posted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- schema.sql's original insert policy let ANY authenticated user post a job.
-- Now that jobs belong to a company, only that company's admins may post
-- under it (and only its admins may edit/close it).
DROP POLICY IF EXISTS "Authenticated users can insert jobs" ON public.jobs;

CREATE POLICY "Company admins post jobs" ON public.jobs FOR INSERT WITH CHECK (
    posted_by = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.company_members m
        WHERE m.company_id = jobs.company_id AND m.user_id = auth.uid() AND m.role = 'admin'
    )
);

CREATE POLICY "Company admins update own jobs" ON public.jobs FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.company_members m
        WHERE m.company_id = jobs.company_id AND m.user_id = auth.uid() AND m.role = 'admin'
    )
);

CREATE POLICY "Company admins delete own jobs" ON public.jobs FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.company_members m
        WHERE m.company_id = jobs.company_id AND m.user_id = auth.uid() AND m.role = 'admin'
    )
);

CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);

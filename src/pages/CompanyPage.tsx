import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Globe,
  Share2,
  Check,
  Users,
  Loader2,
  Briefcase,
  Plus,
  IndianRupee,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Company, EmploymentType, RemoteType } from '../types';

interface CompanyPageProps {
  companyId: string | null;
  onBack: () => void;
}

interface CompanyJob {
  id: string;
  title: string;
  location: string;
  employmentType: string;
  remoteType: string;
  salaryMin?: number;
  salaryMax?: number;
  applyUrl: string;
  postedAt: string;
}

const emptyJobForm = {
  title: '',
  location: '',
  employmentType: 'full-time' as EmploymentType,
  remoteType: 'onsite' as RemoteType,
  experienceLevel: 'Mid-Level',
  description: '',
  skills: '',
  salaryMin: '',
  salaryMax: '',
  applyUrl: '',
};

export const CompanyPage: React.FC<CompanyPageProps> = ({ companyId, onBack }) => {
  const { profile } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [isPosting, setIsPosting] = useState(false);

  const loadJobs = async () => {
    if (!supabase || !companyId) return;
    const { data } = await supabase
      .from('jobs')
      .select('id, title, location, employment_type, remote_type, salary_min, salary_max, apply_url, posted_at')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('posted_at', { ascending: false });
    setJobs(
      (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        location: row.location,
        employmentType: row.employment_type,
        remoteType: row.remote_type,
        salaryMin: row.salary_min ?? undefined,
        salaryMax: row.salary_max ?? undefined,
        applyUrl: row.apply_url,
        postedAt: row.posted_at,
      }))
    );
  };

  useEffect(() => {
    let cancelled = false;
    if (!companyId || !supabase) {
      setCompany(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    async function load() {
      const [{ data: row }, { count }, { data: myMembership }] = await Promise.all([
        supabase!.from('public_companies').select('*').eq('id', companyId).maybeSingle(),
        supabase!.from('company_members').select('user_id', { count: 'exact', head: true }).eq('company_id', companyId),
        profile
          ? supabase!.from('company_members').select('role').eq('company_id', companyId).eq('user_id', profile.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      if (row) {
        setCompany({
          id: row.id,
          slug: row.slug,
          name: row.name,
          logoUrl: row.logo_url,
          coverImageUrl: row.cover_image_url,
          industry: row.industry,
          hqLocation: row.hq_location,
          website: row.website,
          about: row.about,
          companySize: row.company_size,
          foundedYear: row.founded_year,
          createdBy: '',
          createdAt: '',
          updatedAt: '',
        });
      } else {
        setCompany(null);
      }
      setMemberCount(count || 0);
      setIsAdmin((myMembership as any)?.role === 'admin');
      setIsLoading(false);
      await loadJobs();
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [companyId, profile?.id]);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !company || !profile || !jobForm.title.trim() || !jobForm.applyUrl.trim()) return;

    setIsPosting(true);
    const applyUrl = jobForm.applyUrl.includes('@') && !jobForm.applyUrl.startsWith('http')
      ? `mailto:${jobForm.applyUrl.trim()}`
      : jobForm.applyUrl.trim();

    const { error } = await supabase.from('jobs').insert({
      id: `direct_${crypto.randomUUID()}`,
      source: 'direct',
      company_id: company.id,
      posted_by: profile.id,
      title: jobForm.title.trim(),
      company: company.name,
      company_logo: company.logoUrl,
      location: jobForm.location.trim() || company.hqLocation || 'Remote',
      description: jobForm.description.trim(),
      skills: jobForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
      salary_min: jobForm.salaryMin ? Number(jobForm.salaryMin) : null,
      salary_max: jobForm.salaryMax ? Number(jobForm.salaryMax) : null,
      employment_type: jobForm.employmentType,
      remote_type: jobForm.remoteType,
      experience_level: jobForm.experienceLevel,
      apply_url: applyUrl,
      application_type: 'external',
      is_active: true,
    });
    setIsPosting(false);

    if (!error) {
      setJobForm(emptyJobForm);
      setShowJobForm(false);
      await loadJobs();
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin mx-auto" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-400">Company page not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors font-medium text-sm inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 animate-fadeIn pb-24">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-medium shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-medium"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Link Copied' : 'Share'}</span>
        </button>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
        <div
          className="h-28 sm:h-40 w-full bg-gradient-to-r from-brand-600/30 via-purple-600/25 to-blue-600/30 bg-cover bg-center"
          style={company.coverImageUrl ? { backgroundImage: `url(${company.coverImageUrl})` } : undefined}
        />
        <div className="px-5 sm:px-8 pb-6 -mt-10 relative">
          <div className="flex items-end gap-4 mb-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border-4 border-slate-950 flex items-center justify-center shrink-0 text-2xl sm:text-3xl font-black text-brand-300 shadow-xl overflow-hidden">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                company.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">{company.name}</h1>
              {company.industry && <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{company.industry}</p>}
            </div>
            {isAdmin && (
              <span className="ml-auto text-[10px] font-bold px-2 py-1 rounded-lg bg-brand-500/15 text-brand-300 border border-brand-500/30 shrink-0 mb-1">
                You're an admin
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            {company.hqLocation && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>{company.hqLocation}</span>
              </div>
            )}
            {company.website && (
              <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-brand-400">
                <Globe className="w-4 h-4 text-slate-500" />
                <span>{company.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              <span>{memberCount} member{memberCount === 1 ? '' : 's'}</span>
            </div>
            {company.companySize && <span>{company.companySize} employees</span>}
            {company.foundedYear && <span>Founded {company.foundedYear}</span>}
          </div>
        </div>
      </div>

      {company.about && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">About</h3>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{company.about}</p>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-400" />
            <span>Open Positions ({jobs.length})</span>
          </h3>
          {isAdmin && (
            <button
              onClick={() => setShowJobForm((v) => !v)}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Post a Job
            </button>
          )}
        </div>

        {showJobForm && (
          <form onSubmit={handlePostJob} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <input required placeholder="Job title" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white sm:col-span-2" />
            <input placeholder="Location (e.g. Bangalore, India)" value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
            <select value={jobForm.remoteType} onChange={(e) => setJobForm({ ...jobForm, remoteType: e.target.value as RemoteType })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white">
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
            <select value={jobForm.employmentType} onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value as EmploymentType })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white">
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
            <input placeholder="Experience level (e.g. Mid-Level)" value={jobForm.experienceLevel} onChange={(e) => setJobForm({ ...jobForm, experienceLevel: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
            <input type="number" placeholder="Min salary" value={jobForm.salaryMin} onChange={(e) => setJobForm({ ...jobForm, salaryMin: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
            <input type="number" placeholder="Max salary" value={jobForm.salaryMax} onChange={(e) => setJobForm({ ...jobForm, salaryMax: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
            <input placeholder="Skills (comma separated)" value={jobForm.skills} onChange={(e) => setJobForm({ ...jobForm, skills: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white sm:col-span-2" />
            <textarea required placeholder="Job description" value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} rows={3} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white sm:col-span-2" />
            <input required placeholder="Apply link or email" value={jobForm.applyUrl} onChange={(e) => setJobForm({ ...jobForm, applyUrl: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white sm:col-span-2" />
            <button type="submit" disabled={isPosting} className="brand-gradient-btn text-white py-2 rounded-xl font-bold sm:col-span-2 disabled:opacity-50">
              {isPosting ? 'Posting...' : 'Post Job'}
            </button>
          </form>
        )}

        {jobs.length === 0 ? (
          <div className="text-center text-slate-400 py-6 space-y-2">
            <Briefcase className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">No open positions yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <a
                key={job.id}
                href={job.applyUrl}
                target="_blank"
                rel="noreferrer"
                className="block p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-brand-500/40 transition-all"
              >
                <p className="font-bold text-white text-sm">{job.title}</p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                  <span className="capitalize">{job.remoteType} · {job.employmentType}</span>
                  {(job.salaryMin || job.salaryMax) && (
                    <span className="flex items-center gap-0.5 text-emerald-400 font-mono">
                      <IndianRupee className="w-3 h-3" />{job.salaryMin || 0}-{job.salaryMax || job.salaryMin}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

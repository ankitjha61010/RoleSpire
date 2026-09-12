import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Filter,
  SlidersHorizontal,
  X,
  ChevronDown,
  Copy,
  Layers,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Building2,
  Users,
  Briefcase,
  FileText,
  UserCheck,
  Calendar,
  Wrench,
  UserPlus,
  Clock,
  MessageSquare,
  Globe,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Landmark
} from 'lucide-react';
import { Job, JobFilters, JobSortOption, PostAuthor } from '../types';
import { JobCard } from '../components/jobs/JobCard';
import { JobFilterDrawer } from '../components/jobs/JobFilterDrawer';
import { parseNaturalLanguageQuery, ParsedSearchQuery } from '../services/nlp/searchParser';
import { DerivedCompany, deriveCompaniesFromJobs } from '../services/companyDirectory';
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { lookupCompany, isCompanyRegistryConfigured, CompanyRegistryRecord } from '../services/companyRegistry';
import { UserRoleBadge } from '../components/common/UserRoleBadge';
import { ScrollablePaginatedList } from '../components/common/ScrollablePaginatedList';
import confetti from 'canvas-confetti';

const JOBS_PAGE_SIZE = 10;
const COMPANIES_PAGE_SIZE = 10;
const PEOPLE_PAGE_SIZE = 10;
const POSTS_PAGE_SIZE = 10;

export type SearchCategory = 'jobs' | 'people' | 'companies' | 'posts' | 'groups' | 'events' | 'services';

interface SearchPageProps {
  jobs: Job[];
  filters: JobFilters;
  onUpdateFilters: (updated: Partial<JobFilters>) => void;
  onResetFilters: () => void;
  onSelectJob: (job: Job) => void;
  onSelectCompany: (company: DerivedCompany) => void;
  onSelectAuthor: (author: PostAuthor) => void;
  sortOption: JobSortOption;
  setSortOption: (sort: JobSortOption) => void;
  totalCount: number;
  duplicateCount: number;
  isLoading: boolean;
}

const SEARCH_CATEGORIES: { id: SearchCategory; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'jobs', label: 'Jobs', icon: <Briefcase className="w-3.5 h-3.5" />, desc: 'Explore tech roles & openings' },
  { id: 'people', label: 'People', icon: <Users className="w-3.5 h-3.5" />, desc: 'Recruiters, Engineers & Peers' },
  { id: 'companies', label: 'Companies', icon: <Building2 className="w-3.5 h-3.5" />, desc: 'Tech employers & startups' },
  { id: 'posts', label: 'Posts', icon: <FileText className="w-3.5 h-3.5" />, desc: 'Community discussions & referrals' },
  { id: 'groups', label: 'Groups', icon: <UserCheck className="w-3.5 h-3.5" />, desc: 'Tech & developer communities' },
  { id: 'events', label: 'Events', icon: <Calendar className="w-3.5 h-3.5" />, desc: 'Hackathons & hiring summits' },
  { id: 'services', label: 'Services', icon: <Wrench className="w-3.5 h-3.5" />, desc: 'Resume reviews & mock interviews' },
];

const SEARCH_SUGGESTIONS: Record<SearchCategory, string[]> = {
  jobs: [
    'React Native remote roles',
    'Senior Frontend Engineer',
    'Remote MERN jobs above ₹10 LPA',
    'Python developer jobs posted today',
  ],
  people: [
    'Tech Recruiter',
    'Staff Engineer',
    'React Native Developer',
    'Engineering Manager',
  ],
  companies: [
    'Search a company name',
  ],
  posts: [
    'Remote React Native Referral',
    'MERN Stack Walkthrough & Tips',
    'System Design Mock Preparation',
  ],
  groups: [],
  events: [],
  services: [],
};

export const SearchPage: React.FC<SearchPageProps> = ({
  jobs,
  filters,
  onUpdateFilters,
  onResetFilters,
  onSelectJob,
  onSelectCompany,
  onSelectAuthor,
  sortOption,
  setSortOption,
  totalCount,
  duplicateCount,
  isLoading,
}) => {
  const { posts, getConnectionStatus, sendConnectionRequest } = useCommunity();
  const { profile } = useAuth();
  const [registeredUsers, setRegisteredUsers] = useState<PostAuthor[]>([]);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('jobs');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [queryInput, setQueryInput] = useState(filters.query || '');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [parsedMeta, setParsedMeta] = useState<ParsedSearchQuery | null>(null);
  const [jobsPage, setJobsPage] = useState(1);
  const [companiesPage, setCompaniesPage] = useState(1);
  const [registryQuery, setRegistryQuery] = useState('');
  const [registryResult, setRegistryResult] = useState<CompanyRegistryRecord | null>(null);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const [registrySearched, setRegistrySearched] = useState(false);

  const handleRegistryLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!registryQuery.trim()) return;
    setRegistryLoading(true);
    setRegistryError(null);
    setRegistrySearched(true);
    try {
      const result = await lookupCompany(registryQuery);
      setRegistryResult(result);
    } catch (err: any) {
      setRegistryError(err.message || 'Lookup failed. Please try again.');
      setRegistryResult(null);
    } finally {
      setRegistryLoading(false);
    }
  };
  const [peoplePage, setPeoplePage] = useState(1);
  const [postsPage, setPostsPage] = useState(1);

  // Real, cross-account directory of every signed-up user (name/headline/
  // company/avatar only — everything else stays private via the DB view).
  // Without this, "People" could only ever show authors of posts saved in
  // *this browser's* local storage — other real accounts were invisible.
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    supabase
      .from('public_profiles')
      .select('id, full_name, headline, company, avatar_url')
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const mapped: PostAuthor[] = data
          .filter((row: any) => row.id !== profile?.id)
          .map((row: any) => ({
            id: row.id,
            name: row.full_name || 'RoleSpire Member',
            avatarUrl: row.avatar_url || undefined,
            headline: row.headline || 'Job Seeker',
            company: row.company || undefined,
            role: 'job_seeker',
            badgeStatus: 'none',
          }));
        setRegisteredUsers(mapped);
      });

    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  // Reset to page 1 whenever the underlying result set changes
  useEffect(() => {
    setJobsPage(1);
  }, [jobs, activeCategory]);

  useEffect(() => {
    setCompaniesPage(1);
    setPeoplePage(1);
    setPostsPage(1);
  }, [queryInput, activeCategory]);

  // Companies derived from real, live job listings — no fabricated employer data
  const companiesList = useMemo(() => {
    const list = deriveCompaniesFromJobs(jobs);
    if (!queryInput.trim()) return list;
    const q = queryInput.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.topSkills.some((s) => s.toLowerCase().includes(q))
    );
  }, [jobs, queryInput]);

  const pagedJobs = useMemo(
    () => jobs.slice((jobsPage - 1) * JOBS_PAGE_SIZE, jobsPage * JOBS_PAGE_SIZE),
    [jobs, jobsPage]
  );
  const totalJobsPages = Math.max(1, Math.ceil(jobs.length / JOBS_PAGE_SIZE));

  const pagedCompanies = useMemo(
    () => companiesList.slice((companiesPage - 1) * COMPANIES_PAGE_SIZE, companiesPage * COMPANIES_PAGE_SIZE),
    [companiesList, companiesPage]
  );
  const totalCompaniesPages = Math.max(1, Math.ceil(companiesList.length / COMPANIES_PAGE_SIZE));

  // People dataset: every real registered account, plus anyone who's posted
  // in Community but might not have loaded into the directory yet.
  const peopleList = useMemo(() => {
    const peopleMap = new Map<string, PostAuthor>();

    registeredUsers.forEach((u) => peopleMap.set(u.id, u));

    posts.forEach((p) => {
      if (!peopleMap.has(p.author.id)) {
        peopleMap.set(p.author.id, p.author);
      }
    });

    const list = Array.from(peopleMap.values());
    if (!queryInput.trim()) return list;
    const q = queryInput.toLowerCase();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.headline.toLowerCase().includes(q) ||
        (p.company || '').toLowerCase().includes(q) ||
        (p.role || '').toLowerCase().includes(q)
    );
  }, [queryInput, posts, registeredUsers]);

  const pagedPeople = useMemo(
    () => peopleList.slice((peoplePage - 1) * PEOPLE_PAGE_SIZE, peoplePage * PEOPLE_PAGE_SIZE),
    [peopleList, peoplePage]
  );
  const totalPeoplePages = Math.max(1, Math.ceil(peopleList.length / PEOPLE_PAGE_SIZE));

  // Filtered Posts
  const postsList = useMemo(() => {
    if (!queryInput.trim()) return posts;
    const q = queryInput.toLowerCase();
    return posts.filter(
      (p) =>
        p.content.toLowerCase().includes(q) ||
        p.author.name.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [queryInput, posts]);

  const pagedPosts = useMemo(
    () => postsList.slice((postsPage - 1) * POSTS_PAGE_SIZE, postsPage * POSTS_PAGE_SIZE),
    [postsList, postsPage]
  );
  const totalPostsPages = Math.max(1, Math.ceil(postsList.length / POSTS_PAGE_SIZE));

  // Handle Natural Language search trigger
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryInput.trim()) {
      onUpdateFilters({ query: '' });
      setParsedMeta(null);
      return;
    }

    if (activeCategory === 'jobs') {
      const parsed = parseNaturalLanguageQuery(queryInput);
      setParsedMeta(parsed);
      onUpdateFilters({
        query: parsed.cleanedKeyword || queryInput,
        ...parsed.extractedFilters,
      });
    } else {
      onUpdateFilters({ query: queryInput });
    }
  };

  const handleApplySuggestion = (text: string) => {
    setQueryInput(text);
    if (activeCategory === 'jobs') {
      const parsed = parseNaturalLanguageQuery(text);
      setParsedMeta(parsed);
      onUpdateFilters({
        query: parsed.cleanedKeyword || text,
        ...parsed.extractedFilters,
      });
    } else {
      onUpdateFilters({ query: text });
    }
  };

  const handleRemoveTag = (type: keyof JobFilters) => {
    onUpdateFilters({ [type]: undefined });
    if (parsedMeta) {
      setParsedMeta({
        ...parsedMeta,
        appliedTags: parsedMeta.appliedTags.filter((t) => t.type !== type),
      });
    }
  };

  // Compute active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.location) count++;
    if (filters.remoteType && filters.remoteType !== 'all') count++;
    if (filters.minSalary && filters.minSalary > 0) count++;
    if (filters.datePosted && filters.datePosted !== 'all') count++;
    if (filters.source && filters.source !== 'all') count++;
    if (filters.onlyStrongMatches) count++;
    if (filters.hideApplied) count++;
    if (filters.minQualityScore && filters.minQualityScore > 0) count++;
    return count;
  }, [filters]);

  const activeCategoryObj = SEARCH_CATEGORIES.find((c) => c.id === activeCategory) || SEARCH_CATEGORIES[0];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Search & Category Selection Bar */}
      <div className="glass-panel rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-xl space-y-4 relative z-30">
        <form onSubmit={handleSearchSubmit} className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2">

          {/* Category Dropdown (People, Companies, Jobs, Posts, Groups, Events, Services) */}
          <div className="relative z-50">
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-white font-bold text-xs sm:text-sm hover:border-brand-500 transition-all shadow-inner"
            >
              <span className="flex items-center gap-2 text-brand-400">
                {activeCategoryObj.icon}
                <span className="text-white">{activeCategoryObj.label}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isCategoryDropdownOpen && (
              <>
                {/* Backdrop to close when clicking outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCategoryDropdownOpen(false)}
                />

                <div className="absolute left-0 top-full mt-2 w-64 glass-dropdown rounded-2xl p-2 z-50 animate-fadeIn space-y-1 shadow-2xl border border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                    Select Search Filter
                  </div>
                  {SEARCH_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${activeCategory === cat.id
                          ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                          : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                    >
                      <span className={`p-1.5 rounded-lg ${activeCategory === cat.id ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {cat.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold">{cat.label}</div>
                        <div className="text-[10px] text-slate-400 truncate">{cat.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder={
                activeCategory === 'jobs'
                  ? "Try 'Remote MERN jobs above ₹10 LPA' or 'React Native in Ahmedabad'..."
                  : activeCategory === 'companies'
                    ? "Search companies by name or tech stack (e.g. 'Fintech', 'React')..."
                    : activeCategory === 'people'
                      ? "Find recruiters, engineers & mentors by name or role..."
                      : activeCategory === 'posts'
                        ? "Search community posts, questions, and job referrals..."
                        : `Search ${activeCategoryObj.label}...`
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-12 pr-10 py-3.5 text-xs sm:text-sm font-medium text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none shadow-inner"
            />
            {queryInput && (
              <button
                type="button"
                onClick={() => {
                  setQueryInput('');
                  onUpdateFilters({ query: '' });
                  setParsedMeta(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="brand-gradient-btn text-white px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm shadow-lg hover:scale-102 transition-all shrink-0 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Search {activeCategoryObj.label}</span>
          </button>
        </form>

        {/* Category Pills Quick Switch */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Filter by:</span>
          {SEARCH_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${activeCategory === cat.id
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Natural Language Extracted Tags (For Jobs) */}
        {activeCategory === 'jobs' && parsedMeta && parsedMeta.appliedTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Extracted Filters:
            </span>
            {parsedMeta.appliedTags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold"
              >
                <span>{tag.label}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag.type)}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {SEARCH_SUGGESTIONS[activeCategory].length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Suggestions:</span>
            {SEARCH_SUGGESTIONS[activeCategory].map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApplySuggestion(sug)}
                className="text-xs px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all truncate"
              >
                {sug}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RENDER CATEGORY VIEW 1: JOBS */}
      {activeCategory === 'jobs' && (
        <div className="flex items-start gap-6">
          <JobFilterDrawer
            filters={filters}
            onChangeFilters={onUpdateFilters}
            onResetFilters={onResetFilters}
            activeCount={activeFiltersCount}
            isOpenMobile={isMobileFilterOpen}
            onCloseMobile={() => setIsMobileFilterOpen(false)}
          />

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white">
                  {jobs.length} Positions Found
                </span>
                {duplicateCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-mono flex items-center gap-1">
                    <Copy className="w-3 h-3 text-amber-400" /> {duplicateCount} duplicates grouped
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters ({activeFiltersCount})</span>
                </button>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium hidden sm:inline">Sort By:</span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as JobSortOption)}
                    className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:border-brand-500 focus:outline-none"
                  >
                    <option value="best_match">🔥 Highest Match Score</option>
                    <option value="recent">⏱ Most Recent First</option>
                    <option value="highest_salary">💰 Highest Salary</option>
                    <option value="quality">🛡 Job Quality Score</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="glass-panel p-6 rounded-3xl animate-pulse space-y-3">
                    <div className="h-4 bg-slate-800 rounded w-1/3" />
                    <div className="h-3 bg-slate-850 rounded w-1/2" />
                    <div className="h-12 bg-slate-900 rounded" />
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-800/80 flex items-center justify-center text-slate-400 mx-auto">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white">No Matching Openings Found</h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  We couldn’t find any jobs matching all your current constraints. Try clearing or expanding your location or salary threshold.
                </p>
                <button
                  onClick={onResetFilters}
                  className="brand-gradient-btn text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <ScrollablePaginatedList
                currentPage={jobsPage}
                totalPages={totalJobsPages}
                onPageChange={setJobsPage}
              >
                {pagedJobs.map((job) => (
                  <JobCard key={job.id} job={job} onSelectJob={onSelectJob} />
                ))}
              </ScrollablePaginatedList>
            )}
          </div>
        </div>
      )}

      {/* RENDER CATEGORY VIEW 2: COMPANIES */}
      {activeCategory === 'companies' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-brand-400 shrink-0" />
              <span>Companies Actively Hiring ({companiesList.length})</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Built live from current job listings
            </p>
          </div>

          {/* Official India Company Registry Lookup */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-brand-400 shrink-0" />
              <h3 className="text-sm font-bold text-white">Can't find a company above? Verify it in the official registry</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              The list above only shows companies currently hiring on live job boards. Any company registered in India — hiring or not —
              can be looked up directly from the Ministry of Corporate Affairs' official records. This needs the exact registered legal
              name (e.g. <span className="font-mono text-slate-300">KAMAL FINCAP PRIVATE LIMITED</span>) or its CIN — it can't fuzzy-search partial names.
            </p>

            {!isCompanyRegistryConfigured ? (
              <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
                Registry lookup isn't configured yet — add <span className="font-mono">VITE_DATA_GOV_IN_API_KEY</span> and{' '}
                <span className="font-mono">VITE_DATA_GOV_IN_COMPANY_RESOURCE_ID</span> to your environment.
              </div>
            ) : (
              <form onSubmit={handleRegistryLookup} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={registryQuery}
                  onChange={(e) => setRegistryQuery(e.target.value)}
                  placeholder="Exact registered name or CIN (e.g. XXXXXX PRIVATE LIMITED)"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  disabled={registryLoading}
                  className="brand-gradient-btn text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md disabled:opacity-60 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{registryLoading ? 'Looking up…' : 'Look Up'}</span>
                </button>
              </form>
            )}

            {registrySearched && !registryLoading && (
              <div className="pt-2">
                {registryError ? (
                  <div className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5">
                    {registryError}
                  </div>
                ) : !registryResult ? (
                  <div className="text-[11px] text-slate-400 bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
                    No exact match found. Double-check the full legal name (including "Private Limited"/"Limited") or CIN, and try again.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.03] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <h4 className="text-sm font-bold text-white">{registryResult.name}</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{registryResult.cin}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${registryResult.status.toLowerCase() === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-700 text-slate-300'
                          }`}
                      >
                        {registryResult.status || 'Unknown'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="text-slate-500 text-[10px] uppercase tracking-wider">Class / Category</div>
                        <div className="text-slate-200 mt-0.5">{registryResult.companyClass || '—'} · {registryResult.category || '—'}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="text-slate-500 text-[10px] uppercase tracking-wider">Registered On</div>
                        <div className="text-slate-200 mt-0.5">{registryResult.registrationDate || '—'}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="text-slate-500 text-[10px] uppercase tracking-wider">Authorized Capital</div>
                        <div className="text-emerald-400 font-semibold mt-0.5">
                          {registryResult.authorizedCapital ? `₹${Number(registryResult.authorizedCapital).toLocaleString('en-IN')}` : '—'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="text-slate-500 text-[10px] uppercase tracking-wider">Paid-up Capital</div>
                        <div className="text-emerald-400 font-semibold mt-0.5">
                          {registryResult.paidupCapital ? `₹${Number(registryResult.paidupCapital).toLocaleString('en-IN')}` : '—'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 sm:col-span-2">
                        <div className="text-slate-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Registered Office
                        </div>
                        <div className="text-slate-200 mt-0.5">{registryResult.registeredAddress || '—'}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="text-slate-500 text-[10px] uppercase tracking-wider">Industry (NIC)</div>
                        <div className="text-slate-200 mt-0.5">{registryResult.industrialClassification || '—'} {registryResult.nicCode && `(${registryResult.nicCode})`}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="text-slate-500 text-[10px] uppercase tracking-wider">Registrar (RoC)</div>
                        <div className="text-slate-200 mt-0.5">{registryResult.rocCode || '—'}</div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500">
                      Source: Ministry of Corporate Affairs, via data.gov.in — official company registry filing data.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {companiesList.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 border border-slate-800 text-xs">
              No companies to show yet — try a broader search or check back once more listings load.
            </div>
          ) : (
            <ScrollablePaginatedList
              currentPage={companiesPage}
              totalPages={totalCompaniesPages}
              onPageChange={setCompaniesPage}
              listClassName="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {pagedCompanies.map((comp) => (
                <div
                  key={comp.name}
                  className="glass-panel rounded-3xl overflow-hidden border border-slate-800 hover:border-brand-500/40 transition-all hover:shadow-2xl flex flex-col justify-between group"
                >
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-lg font-black text-brand-300">
                          {comp.name.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-lg font-extrabold text-white group-hover:text-brand-300 transition-colors truncate">
                          {comp.name}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                        {comp.locations.slice(0, 2).map((loc) => (
                          <span key={loc}>📍 {loc}</span>
                        ))}
                        <span className="text-emerald-400 font-bold">💼 {comp.jobCount} Active Job{comp.jobCount === 1 ? '' : 's'}</span>
                      </div>

                      {/* Top skills */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {comp.topSkills.slice(0, 4).map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-400 font-medium">
                        via {comp.sources.join(', ')}
                      </span>

                      <button
                        onClick={() => onSelectCompany(comp)}
                        className="brand-gradient-btn text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md group-hover:scale-102 transition-transform"
                      >
                        <span>View Company</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollablePaginatedList>
          )}
        </div>
      )}

      {/* RENDER CATEGORY VIEW 3: PEOPLE */}
      {activeCategory === 'people' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-brand-400 shrink-0" />
              <span>People, Recruiters & Hiring Managers ({peopleList.length})</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Connect with recruiters and engineers directly
            </p>
          </div>

          {peopleList.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 border border-slate-800 text-xs">
              No people to show yet — connections and community posts will populate this list.
            </div>
          ) : (
            <ScrollablePaginatedList
              currentPage={peoplePage}
              totalPages={totalPeoplePages}
              onPageChange={setPeoplePage}
              listClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {pagedPeople.map((p) => {
                const connStatus = getConnectionStatus(p.id);
                return (
                  <div
                    key={p.id}
                    className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-brand-500/40 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                        <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                        {p.badgeStatus === 'hiring' && (
                          <div className="absolute bottom-0 inset-x-0 bg-indigo-600 text-center text-[7px] font-black text-white py-0.2">
                            HIRING
                          </div>
                        )}
                        {p.badgeStatus === 'open_to_work' && (
                          <div className="absolute bottom-0 inset-x-0 bg-emerald-600 text-center text-[7px] font-black text-white py-0.2">
                            OPEN
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3
                            onClick={() => onSelectAuthor(p)}
                            className="font-bold text-white text-sm hover:text-brand-300 transition-colors cursor-pointer truncate"
                          >
                            {p.name}
                          </h3>
                          <UserRoleBadge role={p.role || (p.isRecruiter ? 'recruiter' : 'job_seeker')} badgeStatus={p.badgeStatus || 'none'} size="xs" />
                        </div>

                        <p className="text-xs text-slate-300 font-medium truncate">{p.headline}</p>
                        {p.company && <p className="text-[11px] text-brand-400 font-semibold truncate">@{p.company}</p>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                      {connStatus === 'accepted' ? (
                        <span className="flex-1 py-1.5 text-center rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                        </span>
                      ) : connStatus === 'pending' ? (
                        <span className="flex-1 py-1.5 text-center rounded-xl bg-amber-500/10 text-amber-400 text-xs font-semibold animate-pulse flex items-center justify-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Pending...
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            sendConnectionRequest(p);
                            confetti({ particleCount: 20, spread: 40 });
                          }}
                          className="flex-1 py-1.5 rounded-xl brand-gradient-btn text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </button>
                      )}

                      <button
                        onClick={() => onSelectAuthor(p)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </ScrollablePaginatedList>
          )}
        </div>
      )}

      {/* RENDER CATEGORY VIEW 4: POSTS */}
      {activeCategory === 'posts' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-400" />
            <span>Community Posts & Referrals ({postsList.length})</span>
          </h2>

          {postsList.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 border border-slate-800 text-xs">
              No posts yet — be the first to share something in Community.
            </div>
          ) : (
            <ScrollablePaginatedList
              currentPage={postsPage}
              totalPages={totalPostsPages}
              onPageChange={setPostsPage}
            >
              {pagedPosts.map((post) => (
                <div key={post.id} className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <img src={post.author.avatarUrl} alt={post.author.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          onClick={() => onSelectAuthor(post.author)}
                          className="font-bold text-white text-sm hover:text-brand-300 cursor-pointer"
                        >
                          {post.author.name}
                        </span>
                        <UserRoleBadge role={post.author.role} badgeStatus={post.author.badgeStatus} size="xs" />
                      </div>
                      <span className="text-xs text-slate-400">{post.author.headline}</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap">{post.content}</p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {post.tags.map((t) => (
                      <span key={t} className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-brand-300 text-xs">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollablePaginatedList>
          )}
        </div>
      )}

      {/* RENDER CATEGORY VIEW 5: GROUPS */}
      {activeCategory === 'groups' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-brand-400" />
            <span>Developer Communities & Groups</span>
          </h2>
          <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 border border-slate-800 text-xs">
            Groups are coming soon. Check back once this feature is live.
          </div>
        </div>
      )}

      {/* RENDER CATEGORY VIEW 6: EVENTS */}
      {activeCategory === 'events' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-400" />
            <span>Hiring Summits & Tech Events</span>
          </h2>
          <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 border border-slate-800 text-xs">
            No events to show right now. Check back soon.
          </div>
        </div>
      )}

      {/* RENDER CATEGORY VIEW 7: SERVICES */}
      {activeCategory === 'services' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-brand-400" />
            <span>Career Acceleration & Expert Services</span>
          </h2>
          <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 border border-slate-800 text-xs">
            Expert services aren't available yet. Check back soon.
          </div>
        </div>
      )}
    </div>
  );
};


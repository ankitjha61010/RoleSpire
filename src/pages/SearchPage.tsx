import React, { useState, useMemo } from 'react';
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
  ExternalLink,
  ShieldCheck,
  Star,
  UserPlus,
  Clock,
  MessageSquare,
  Globe,
  ArrowRight
} from 'lucide-react';
import { Job, JobFilters, JobSortOption, PostAuthor } from '../types';
import { JobCard } from '../components/jobs/JobCard';
import { JobFilterDrawer } from '../components/jobs/JobFilterDrawer';
import { parseNaturalLanguageQuery, ParsedSearchQuery } from '../services/nlp/searchParser';
import { CompanyData, MOCK_COMPANIES } from '../services/mockCompanies';
import { useCommunity } from '../context/CommunityContext';
import { UserRoleBadge } from '../components/common/UserRoleBadge';
import confetti from 'canvas-confetti';

export type SearchCategory = 'jobs' | 'people' | 'companies' | 'posts' | 'groups' | 'events' | 'services';

interface SearchPageProps {
  jobs: Job[];
  filters: JobFilters;
  onUpdateFilters: (updated: Partial<JobFilters>) => void;
  onResetFilters: () => void;
  onSelectJob: (job: Job) => void;
  onSelectCompany: (company: CompanyData) => void;
  onSelectAuthor: (author: PostAuthor) => void;
  sortOption: JobSortOption;
  setSortOption: (sort: JobSortOption) => void;
  totalCount: number;
  duplicateCount: number;
  isRealApiActive: boolean;
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
    'React Native in Ahmedabad',
    'Remote MERN jobs above ₹10 LPA',
    'Senior Frontend at Stripe or Linear',
    'Python developer jobs posted today',
  ],
  people: [
    'Priya Sharma Tech Recruiter',
    'Rohit Verma React Native',
    'Sarah Jenkins Stripe Talent',
    'Arjun Mehta Staff Engineer',
  ],
  companies: [
    'Razorpay',
    'Linear',
    'Swiggy',
    'Stripe',
  ],
  posts: [
    'Remote React Native Referral',
    'MERN Stack Walkthrough & Tips',
    'System Design Mock Preparation',
  ],
  groups: [
    'React Native India Developers',
    'Bangalore Tech Lead Circle',
    'Remote First Global Engineers',
  ],
  events: [
    'Bangalore Tech Hiring Summit 2026',
    'Global React Summit Live',
    'Fintech Engineering Hackathon',
  ],
  services: [
    '1-on-1 Senior Staff Resume Review',
    'React & System Design Mock Interview',
    'Portfolio Architecture Review',
  ],
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
  isRealApiActive,
  isLoading,
}) => {
  const { posts, getConnectionStatus, sendConnectionRequest } = useCommunity();
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('jobs');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [queryInput, setQueryInput] = useState(filters.query || '');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [parsedMeta, setParsedMeta] = useState<ParsedSearchQuery | null>(null);

  // Filtered Companies
  const companiesList = useMemo(() => {
    const list = Object.values(MOCK_COMPANIES);
    if (!queryInput.trim()) return list;
    const q = queryInput.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.about.toLowerCase().includes(q) ||
        c.specialties.some((s) => s.toLowerCase().includes(q))
    );
  }, [queryInput]);

  // People dataset gathered from mock companies and community posts
  const peopleList = useMemo(() => {
    const peopleMap = new Map<string, PostAuthor>();

    // Add company employees & recruiters
    Object.values(MOCK_COMPANIES).forEach((c) => {
      c.employees.forEach((emp) => {
        peopleMap.set(emp.id, {
          id: emp.id,
          name: emp.name,
          avatarUrl: emp.avatar,
          headline: emp.headline,
          company: c.name,
          isRecruiter: emp.isRecruiter,
          role: emp.isRecruiter ? 'recruiter' : 'job_seeker',
          badgeStatus: emp.isHiring ? 'hiring' : 'open_to_work',
        });
      });
    });

    // Add post authors
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
        p.company?.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q)
    );
  }, [queryInput, posts]);

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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                        activeCategory === cat.id
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
                  ? "Search companies by name, tech stack, or industry (e.g. 'Razorpay', 'Linear', 'Fintech')..."
                  : activeCategory === 'people'
                  ? "Find recruiters, engineers & mentors (e.g. 'Priya Sharma', 'React Native Recruiter')..."
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeCategory === cat.id
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
                {isRealApiActive && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-mono font-semibold">
                    Live API
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
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} onSelectJob={onSelectJob} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER CATEGORY VIEW 2: COMPANIES */}
      {activeCategory === 'companies' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-400" />
              <span>Verified Companies & Tech Employers ({companiesList.length})</span>
            </h2>
            <span className="text-xs text-slate-400">Click any company to open complete LinkedIn-style profile</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {companiesList.map((comp) => (
              <div
                key={comp.id}
                className="glass-panel rounded-3xl overflow-hidden border border-slate-800 hover:border-brand-500/40 transition-all hover:shadow-2xl flex flex-col justify-between group"
              >
                {/* Mini banner */}
                <div className="h-24 w-full relative bg-slate-900 overflow-hidden">
                  <img src={comp.bannerUrl} alt={comp.name} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                </div>

                <div className="p-6 pt-0 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Logo & Rating Header */}
                    <div className="flex items-end justify-between -mt-10 mb-3">
                      <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-800 shadow-xl overflow-hidden shrink-0">
                        <img src={comp.logo} alt={comp.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                        <Star className="w-3.5 h-3.5 fill-current" /> {comp.rating}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-extrabold text-white group-hover:text-brand-300 transition-colors">
                        {comp.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 text-[10px] font-semibold">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium mt-1 line-clamp-2">
                      {comp.tagline}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-3">
                      <span>📍 {comp.headquarters}</span>
                      <span>👥 {comp.companySize}</span>
                      <span className="text-emerald-400 font-bold">💼 {comp.activeJobsCount} Active Jobs</span>
                    </div>

                    {/* Specialties tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {comp.specialties.slice(0, 4).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400 font-medium">
                      {comp.followersCount.toLocaleString()} followers
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
          </div>
        </div>
      )}

      {/* RENDER CATEGORY VIEW 3: PEOPLE */}
      {activeCategory === 'people' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-400" />
              <span>People, Recruiters & Hiring Managers ({peopleList.length})</span>
            </h2>
            <span className="text-xs text-slate-400">Connect with recruiters and engineers directly</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {peopleList.map((p) => {
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
          </div>
        </div>
      )}

      {/* RENDER CATEGORY VIEW 4: POSTS */}
      {activeCategory === 'posts' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-400" />
            <span>Community Posts & Referrals ({postsList.length})</span>
          </h2>

          {postsList.map((post) => (
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
        </div>
      )}

      {/* RENDER CATEGORY VIEW 5: GROUPS */}
      {activeCategory === 'groups' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-brand-400" />
            <span>Developer Communities & Groups</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'React Native India Engineers', members: '14,200', desc: 'Active discussions, offline meetups, and native bridges.' },
              { name: 'Fintech Backend & Infra Circle', members: '8,900', desc: 'Distributed transactions, microservices, and payment engines.' },
              { name: 'Remote Job Seekers Club', members: '24,500', desc: 'Daily referral leads, compensation transparent insights.' },
            ].map((g, i) => (
              <div key={i} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">{g.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{g.desc}</p>
                  <div className="text-[11px] text-brand-400 font-semibold mt-2">👥 {g.members} members</div>
                </div>
                <button className="brand-gradient-btn text-white py-1.5 px-3 rounded-xl text-xs font-bold w-full">
                  Join Group
                </button>
              </div>
            ))}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'Bangalore Tech Hiring Summit 2026', date: 'Oct 24, 2026', location: 'Online & Indiranagar, BLR', host: 'Razorpay & Zepto' },
              { title: 'Global React & Next.js Architecture Summit', date: 'Nov 12, 2026', location: '100% Virtual / Stream', host: 'Linear Engineering' },
            ].map((ev, i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs text-brand-400 font-bold">
                  <Calendar className="w-4 h-4" /> {ev.date}
                </div>
                <h3 className="font-extrabold text-white text-base">{ev.title}</h3>
                <p className="text-xs text-slate-400">📍 {ev.location} • Hosted by {ev.host}</p>
                <button className="brand-gradient-btn text-white py-2 px-4 rounded-xl text-xs font-bold">
                  Register Free
                </button>
              </div>
            ))}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Staff Engineer Resume Critique', price: '₹999 / $15', desc: 'Actionable ATS formatting and bullet point re-writes from verified hiring leads.' },
              { title: 'Live 1-on-1 System Design Mock', price: '₹2,499 / $35', desc: '60-minute interactive whiteboarding session with feedback on distributed architectures.' },
              { title: 'LinkedIn & RoleSpire Profile Polish', price: '₹1,499 / $20', desc: 'Optimize your bio, headline, and project tags to get 4x recruiter inbound queries.' },
            ].map((serv, i) => (
              <div key={i} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">{serv.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{serv.desc}</p>
                  <div className="text-xs text-emerald-400 font-bold mt-2">{serv.price}</div>
                </div>
                <button className="brand-gradient-btn text-white py-1.5 px-3 rounded-xl text-xs font-bold w-full">
                  Book Session
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


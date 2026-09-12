import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Briefcase, 
  Layers, 
  ArrowRight, 
  Flame, 
  Compass,
  Lightbulb
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApplications } from '../context/ApplicationContext';
import { Job, JobFilters } from '../types';
import { JobCard } from '../components/jobs/JobCard';
import { NavPage } from '../components/layout/Navbar';

interface HomePageProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  setActivePage: (page: NavPage) => void;
  onSearchWithFilters: (filters: Partial<JobFilters>) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  jobs,
  onSelectJob,
  setActivePage,
  onSearchWithFilters,
}) => {
  const { profile } = useAuth();
  const { applications } = useApplications();

  // Interactive search state in hero
  const [heroTitle, setHeroTitle] = useState('React Native Developer');
  const [heroLocation, setHeroLocation] = useState('Ahmedabad');
  const [heroRemote, setHeroRemote] = useState<'remote' | 'hybrid' | 'all'>('remote');
  const [heroSalary, setHeroSalary] = useState(1200000);

  const handleHeroSearch = () => {
    onSearchWithFilters({
      query: heroTitle,
      location: heroLocation === 'Anywhere' ? undefined : heroLocation,
      remoteType: heroRemote === 'all' ? 'all' : heroRemote,
      minSalary: heroSalary > 0 ? heroSalary : undefined,
    });
    setActivePage('search');
  };

  const strongMatchesCount = jobs.filter((j) => (j.matchScore?.totalScore || 0) >= 80).length;
  const bestMatchJob = [...jobs].sort((a, b) => (b.matchScore?.totalScore || 0) - (a.matchScore?.totalScore || 0))[0];
  const freshJobs = jobs.filter((j) => j.qualityScore?.freshnessStatus === 'hot' || j.qualityScore?.freshnessStatus === 'active').slice(0, 3);

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* 1. Sleek Modern Dashboard Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl glass-panel p-4 sm:p-7 border border-brand-500/25 shadow-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-xs font-bold text-brand-300">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              AI Match Engine & Career Intelligence
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
              ● Live Jobs Active
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Welcome back, <span className="brand-gradient-text">{profile?.fullName || 'Engineer'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-1 max-w-2xl">
              RoleSpire evaluates millions of data points to pinpoint your strongest job matches, analyze missing skills, and accelerate recruiter connections.
            </p>
          </div>

          {/* Clean Integrated Search Bar */}
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Role Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-brand-400" /> Target Role
                </label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="e.g. React Native, Full Stack"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-cyan-400" /> Location
                </label>
                <select
                  value={heroLocation}
                  onChange={(e) => setHeroLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:border-brand-500 focus:outline-none transition-all"
                >
                  <option value="Ahmedabad">Ahmedabad, India</option>
                  <option value="Bangalore">Bangalore, India</option>
                  <option value="Pune">Pune, India</option>
                  <option value="Anywhere">Worldwide / Remote</option>
                </select>
              </div>

              {/* Flexibility */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-purple-400" /> Work Mode
                </label>
                <select
                  value={heroRemote}
                  onChange={(e) => setHeroRemote(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:border-brand-500 focus:outline-none transition-all"
                >
                  <option value="remote">🌐 100% Remote</option>
                  <option value="hybrid">🏢 Hybrid Office</option>
                  <option value="all">Any Work Style</option>
                </select>
              </div>

              {/* Min Salary */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Min Compensation
                </label>
                <select
                  value={heroSalary}
                  onChange={(e) => setHeroSalary(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:border-brand-500 focus:outline-none transition-all"
                >
                  <option value={1000000}>₹10 LPA+</option>
                  <option value={1500000}>₹15 LPA+</option>
                  <option value={2000000}>₹20 LPA+</option>
                  <option value={3000000}>₹30 LPA+</option>
                  <option value={0}>Any Range</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Tags & CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[11px] font-bold text-slate-400">Popular:</span>
                <button
                  type="button"
                  onClick={() => {
                    setHeroTitle('React Native Developer');
                    setHeroLocation('Ahmedabad');
                    setHeroRemote('hybrid');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium transition-all"
                >
                  React Native Ahmedabad
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeroTitle('MERN Stack Developer');
                    setHeroRemote('remote');
                    setHeroSalary(1200000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium transition-all"
                >
                  Remote MERN &gt; ₹12 LPA
                </button>
              </div>

              <button
                type="button"
                onClick={handleHeroSearch}
                className="w-full sm:w-auto brand-gradient-btn text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-brand-500/25 transition-all hover:scale-102 active:scale-98"
              >
                <Search className="w-4 h-4" />
                <span>Search Jobs</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Intelligence Metrics (4-Card Grid) */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">Live Opportunity Metrics</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Real-time fit index</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-emerald-500/40 transition-all bg-gradient-to-br from-slate-900 to-slate-950 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold">Top Match Score</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {bestMatchJob?.matchScore?.totalScore || 92}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              {bestMatchJob?.company || 'Razorpay / Tech'}
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-cyan-500/40 transition-all bg-gradient-to-br from-slate-900 to-slate-950 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold">Active Postings</span>
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Flame className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {jobs.length}
            </div>
            <div className="text-[11px] text-cyan-300 mt-1">
              🔥 {freshJobs.length} fresh in 48h
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-brand-500/40 transition-all bg-gradient-to-br from-slate-900 to-slate-950 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold">High Fit Roles</span>
              <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-brand-300">
              {strongMatchesCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              &gt;80% match verified
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 transition-all bg-gradient-to-br from-slate-900 to-slate-950 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold">Tracked Pipeline</span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-300">
              {applications.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {applications.filter((a) => a.status === 'interview').length} active interviews
            </div>
          </div>
        </div>
      </section>

      {/* 3. Sleek AI Skill Match & Career Insight Banner */}
      <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-950/70 via-slate-900 to-cyan-950/60 border border-brand-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-start gap-3 w-full sm:w-auto">
          <div className="p-2.5 rounded-xl brand-gradient-btn text-white shadow-md shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-xs sm:text-sm font-bold text-white">
                Personalized Skill Match Advantage
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/40 font-semibold whitespace-nowrap">
                92% Profile Fit
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your profile is in high demand for <strong>React Native, TypeScript, & Node.js</strong>. Upskilling in <span className="text-brand-300 font-bold">AWS & Docker</span> will unlock 8 additional high-paying listings.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActivePage('profile')}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 text-xs font-bold shrink-0 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
        >
          <span>Enhance Skills</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>

      {/* 4. Top Recommended Job Matches */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 px-1">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
              <span className="truncate">Highest Match Openings for You</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Ranked with multi-dimensional match score & verified company freshness
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActivePage('foryou')}
            className="self-start sm:self-auto text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 transition-all shrink-0"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.slice(0, 4).map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onSelectJob={onSelectJob}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

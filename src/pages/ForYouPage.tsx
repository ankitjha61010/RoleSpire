import React, { useState } from 'react';
import { 
  Sparkles, 
  Flame, 
  IndianRupee, 
  Globe, 
  ShieldCheck, 
  Settings2, 
  ArrowRight,
  TrendingUp,
  Check
} from 'lucide-react';
import { Job } from '../types';
import { JobCard } from '../components/jobs/JobCard';
import { useAuth } from '../context/AuthContext';
import { NavPage } from '../components/layout/Navbar';

interface ForYouPageProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  setActivePage: (page: NavPage) => void;
}

export const ForYouPage: React.FC<ForYouPageProps> = ({ jobs, onSelectJob, setActivePage }) => {
  const { profile, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'best' | 'fresh' | 'salary' | 'remote'>('all');
  const [showPrefModal, setShowPrefModal] = useState(false);

  // Groupings
  const bestMatches = jobs.filter((j) => (j.matchScore?.totalScore || 0) >= 85);
  const freshJobs = jobs.filter((j) => j.qualityScore?.freshnessStatus === 'hot');
  const highSalaryJobs = jobs.filter((j) => (j.salaryMax || 0) >= 2500000);
  const remoteJobs = jobs.filter((j) => j.remoteType === 'remote');

  const displayedJobs = (() => {
    switch (activeTab) {
      case 'best': return bestMatches;
      case 'fresh': return freshJobs;
      case 'salary': return highSalaryJobs;
      case 'remote': return remoteJobs;
      default: return jobs;
    }
  })();

  return (
    <div className="space-y-8 pb-20">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-brand-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-brand-500/15 border border-brand-500/30 text-xs font-bold text-brand-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personalized Job Feed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Curated Recommendations for {profile?.fullName || 'You'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Ranked according to your {profile?.experienceYears || 3.5} years of experience, verified skills, and compensation goals.
          </p>
        </div>

        <button
          onClick={() => setActivePage('profile')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shrink-0"
        >
          <Settings2 className="w-4 h-4 text-brand-400" />
          <span>Tune Preferences</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'all'
              ? 'brand-gradient-btn text-white shadow-md'
              : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>All Top Picks ({jobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('best')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'best'
              ? 'brand-gradient-btn text-white shadow-md'
              : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>Best Matches (85%+) ({bestMatches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fresh')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'fresh'
              ? 'brand-gradient-btn text-white shadow-md'
              : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>Fresh Today ({freshJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('salary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'salary'
              ? 'brand-gradient-btn text-white shadow-md'
              : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
          <span>High Salary ({highSalaryJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('remote')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'remote'
              ? 'brand-gradient-btn text-white shadow-md'
              : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>100% Remote ({remoteJobs.length})</span>
        </button>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayedJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onSelectJob={onSelectJob}
          />
        ))}
      </div>
    </div>
  );
};

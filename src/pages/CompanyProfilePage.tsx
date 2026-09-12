import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  Share2,
  Check,
  ExternalLink,
  Wifi,
} from 'lucide-react';
import { DerivedCompany } from '../services/companyDirectory';
import { Job } from '../types';
import { JobCard } from '../components/jobs/JobCard';

interface CompanyProfilePageProps {
  company: DerivedCompany | null;
  onBack: () => void;
  onSelectJob: (job: Job) => void;
}

export const CompanyProfilePage: React.FC<CompanyProfilePageProps> = ({
  company,
  onBack,
  onSelectJob,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'jobs'>('home');
  const [copied, setCopied] = useState(false);

  if (!company) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-400">Company profile not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors font-medium text-sm inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 animate-fadeIn pb-24">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-medium shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Search</span>
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-medium"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Link Copied' : 'Share Company'}</span>
        </button>
      </div>

      {/* Main Company Header Card */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
        <div className="px-5 sm:px-8 py-6 relative">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-2xl sm:text-3xl font-black text-brand-300">
              {company.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
                {company.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Profile built from {company.jobCount} live job listing{company.jobCount === 1 ? '' : 's'} across{' '}
                {company.sources.join(', ')}
              </p>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Briefcase className="w-3.5 h-3.5" />
              <span>{company.jobCount} Active Job{company.jobCount === 1 ? '' : 's'}</span>
            </div>
            {company.remoteJobCount > 0 && (
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-slate-500" />
                <span>{company.remoteJobCount} Remote</span>
              </div>
            )}
            {company.locations.slice(0, 3).map((loc) => (
              <div key={loc} className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{loc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 sm:px-8 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-2 sm:gap-6 overflow-x-auto scrollbar-none">
          {[
            { id: 'home', label: 'Home' },
            { id: 'about', label: 'Tech & Skills' },
            { id: 'jobs', label: `Jobs (${company.jobCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Home */}
      {activeTab === 'home' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-400" />
              <span>Recent Job Openings at {company.name}</span>
            </h3>
            {company.jobCount > 4 && (
              <button
                onClick={() => setActiveTab('jobs')}
                className="text-xs font-semibold text-brand-400 hover:underline"
              >
                View all ({company.jobCount}) →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {company.jobs.slice(0, 4).map((j) => (
              <JobCard key={j.id} job={j} onSelectJob={() => onSelectJob(j)} />
            ))}
          </div>
        </div>
      )}

      {/* Tab: About / Tech & Skills */}
      {activeTab === 'about' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-400" />
              <span>Where {company.name} is hiring</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {company.locations.map((loc) => (
                <span key={loc} className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" /> {loc}
                </span>
              ))}
              {company.locations.length === 0 && (
                <span className="text-xs text-slate-500">No location data available.</span>
              )}
            </div>
          </div>

          {company.topSkills.length > 0 && (
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Most Requested Skills</h4>
              <p className="text-[11px] text-slate-500">Extracted from this company's live job postings.</p>
              <div className="flex flex-wrap gap-2">
                {company.topSkills.map((s) => (
                  <span key={s} className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-brand-300 text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Sourced from</span>
            <span className="text-slate-300 font-semibold flex items-center gap-1">
              {company.sources.join(', ')}
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </span>
          </div>
        </div>
      )}

      {/* Tab: Jobs */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              All Openings ({company.jobCount})
            </h3>
            <span className="text-xs text-slate-400">Live listings only</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {company.jobs.map((j) => (
              <JobCard key={j.id} job={j} onSelectJob={() => onSelectJob(j)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

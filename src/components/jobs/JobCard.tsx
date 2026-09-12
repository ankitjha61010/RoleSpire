import React, { useState } from 'react';
import { 
  MapPin, 
  IndianRupee, 
  DollarSign, 
  Sparkles, 
  ShieldCheck, 
  Bookmark, 
  GitCompare, 
  ExternalLink, 
  Copy
} from 'lucide-react';
import { Job } from '../../types';
import { useSavedJobs } from '../../context/SavedJobsContext';
import { useJobComparison } from '../../context/ComparisonContext';
import { useAuth } from '../../context/AuthContext';
import { CompanyAvatar } from './CompanyAvatar';

interface JobCardProps {
  job: Job;
  onSelectJob: (job: Job) => void;
  onQuickApply?: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onSelectJob, onQuickApply }) => {
  const { profile } = useAuth();
  const { isJobSaved, saveJob, removeSavedJob, customFolders } = useSavedJobs();
  const { isJobInComparison, addJobToCompare, removeJobFromCompare } = useJobComparison();

  const [showFolderDropdown, setShowFolderDropdown] = useState(false);

  const saved = isJobSaved(job.id);
  const inComparison = isJobInComparison(job.id);
  const match = job.matchScore;
  const quality = job.qualityScore;

  // Format salary display
  const formatSalary = () => {
    if (!job.salaryMin && !job.salaryMax) return 'Competitive';
    if (job.currency === 'INR') {
      const minL = job.salaryMin ? (job.salaryMin / 100000).toFixed(1) : null;
      const maxL = job.salaryMax ? (job.salaryMax / 100000).toFixed(1) : null;
      if (minL && maxL) return `₹${minL}L - ₹${maxL}L / yr`;
      return `₹${maxL || minL}L+ / yr`;
    }
    const minK = job.salaryMin ? `${Math.round(job.salaryMin / 1000)}k` : '';
    const maxK = job.salaryMax ? `${Math.round(job.salaryMax / 1000)}k` : '';
    return `$${minK}${minK && maxK ? ' - $' : ''}${maxK} / yr`;
  };

  // User skills map for highlighting matching pills
  const userSkillNames = (profile?.skills || []).map((s) => s.name.toLowerCase().trim());

  // Match score color badge
  const getMatchBadgeColor = (score: number = 75) => {
    if (score >= 85) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
    if (score >= 70) return 'bg-brand-500/15 text-brand-300 border-brand-500/40';
    return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
  };

  return (
    <div className={`group relative glass-panel rounded-2xl p-4 sm:p-5 transition-all duration-150 hover:shadow-xl hover:border-brand-500/40 hover:bg-slate-900/95 ${
      job.isDuplicate ? 'opacity-90 border-dashed border-slate-700' : ''
    }`}>
      {/* Duplicate cluster banner */}
      {job.isDuplicate && (
        <div className="mb-2.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-[10px] text-amber-300">
          <span className="flex items-center gap-1 font-medium">
            <Copy className="w-3 h-3" /> Duplicate listing detected across feeds
          </span>
          <span className="font-mono bg-amber-500/20 px-1 py-0.2 rounded">
            Grouped
          </span>
        </div>
      )}

      {/* Top Header: Scores & Actions */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Match Score */}
          {match && (
            <div className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 shadow-sm ${getMatchBadgeColor(match.totalScore)}`}>
              <Sparkles className="w-3 h-3" />
              <span>{match.totalScore}% Match</span>
            </div>
          )}

          {/* Job Quality Score */}
          {quality && (
            <div className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-semibold text-slate-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              <span>Quality: {quality.score}/100</span>
            </div>
          )}

          {/* Freshness Badge */}
          {quality && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              quality.freshnessStatus === 'hot' 
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {quality.freshnessLabel}
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (inComparison) removeJobFromCompare(job.id);
              else addJobToCompare(job);
            }}
            className={`p-1.5 rounded-lg transition-all border ${
              inComparison
                ? 'bg-brand-500 text-white border-brand-400 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800 border-slate-800'
            }`}
            title={inComparison ? 'Remove from comparison' : 'Compare job'}
          >
            <GitCompare className="w-3.5 h-3.5" />
          </button>

          <div className="relative">
            <button
              onClick={() => {
                if (saved) {
                  removeSavedJob(job.id);
                } else {
                  setShowFolderDropdown(!showFolderDropdown);
                }
              }}
              className={`p-1.5 rounded-lg transition-all border ${
                saved
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 border-slate-800'
              }`}
              title={saved ? 'Job Saved' : 'Save job'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
            </button>

            {showFolderDropdown && (
              <div className="absolute right-0 mt-2 w-44 glass-dropdown rounded-xl p-1.5 shadow-2xl z-30 border border-slate-700/80 text-xs">
                <button
                  onClick={() => {
                    saveJob(job.id, 'saved');
                    setShowFolderDropdown(false);
                  }}
                  className="w-full text-left px-2 py-1 text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-1.5"
                >
                  <Bookmark className="w-3 h-3 text-slate-400" /> Saved
                </button>
                <button
                  onClick={() => {
                    saveJob(job.id, 'dream_jobs');
                    setShowFolderDropdown(false);
                  }}
                  className="w-full text-left px-2 py-1 text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-pink-400" /> Dream Jobs
                </button>
                <button
                  onClick={() => {
                    saveJob(job.id, 'high_priority');
                    setShowFolderDropdown(false);
                  }}
                  className="w-full text-left px-2 py-1 text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-1.5"
                >
                  <span className="text-amber-400">🔥</span> High Priority
                </button>
                {customFolders.map((cf) => (
                  <button
                    key={cf.id}
                    onClick={() => {
                      saveJob(job.id, 'custom', cf.id);
                      setShowFolderDropdown(false);
                    }}
                    className="w-full text-left px-2 py-1 text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 truncate"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cf.color }} />
                    <span className="truncate">{cf.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="cursor-pointer" onClick={() => onSelectJob(job)}>
        <div className="flex items-start gap-2.5 sm:gap-3 mb-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0 overflow-hidden">
            <CompanyAvatar logoUrl={job.companyLogo} companyName={job.company} />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-brand-300 transition-colors leading-snug line-clamp-2">
              {job.title}
            </h3>
            <div className="text-xs text-brand-300 font-semibold truncate mt-0.5">
              {job.company}
            </div>
          </div>
        </div>

        {/* Location & Salary Chips */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-300 mb-2.5">
          <div className="flex items-center gap-1 text-slate-400 text-[11px] truncate max-w-[180px]">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>

          <div className="flex items-center gap-1 text-emerald-400 font-semibold font-mono text-[11px] whitespace-nowrap">
            {job.currency === 'INR' ? <IndianRupee className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
            <span>{formatSalary()}</span>
          </div>

          <div className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 capitalize whitespace-nowrap">
            {job.remoteType}
          </div>
        </div>

        {/* Snippet */}
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {job.description}
        </p>

        {/* Skills */}
        <div className="flex flex-wrap items-center gap-1 mb-3">
          {(job.skills || []).slice(0, 4).map((skill) => {
            const isMatched = userSkillNames.some(
              (us) => us === skill.toLowerCase() || us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us)
            );
            return (
              <span
                key={skill}
                className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-all ${
                  isMatched
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 font-semibold'
                    : 'bg-slate-800/80 text-slate-300 border border-slate-700/50'
                }`}
              >
                {isMatched && <span className="mr-0.5">✓</span>}
                {skill}
              </span>
            );
          })}
          {(job.skills || []).length > 4 && (
            <span className="text-[10px] text-slate-500 font-mono px-1">
              +{job.skills.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        <div className="text-[10px] text-slate-400 truncate">
          <span className="text-slate-500">Source:</span> <span className="text-slate-300 font-medium capitalize">{job.source}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onSelectJob(job)}
            className="px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-xs font-medium"
          >
            Details
          </button>

          <a
            href={job.applyUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              if (onQuickApply) onQuickApply(job);
            }}
            className="brand-gradient-btn text-white px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all shadow-sm text-xs"
          >
            <span>Apply</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

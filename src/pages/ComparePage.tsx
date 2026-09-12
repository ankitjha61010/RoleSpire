import React from 'react';
import { 
  GitCompare, 
  Sparkles, 
  ShieldCheck, 
  IndianRupee, 
  DollarSign, 
  MapPin, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { useJobComparison } from '../context/ComparisonContext';
import { useApplications } from '../context/ApplicationContext';
import { NavPage } from '../components/layout/Navbar';
import { Job } from '../types';

interface ComparePageProps {
  allJobs: Job[];
  onSelectJob: (job: Job) => void;
  setActivePage: (page: NavPage) => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({ allJobs, onSelectJob, setActivePage }) => {
  const { comparedJobs, removeJobFromCompare, addJobToCompare, bestOptionJobId } = useJobComparison();
  const { createApplication } = useApplications();

  const uncomparedJobs = allJobs.filter((j) => !comparedJobs.some((cj) => cj.id === j.id));

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Multi-Job Comparison Matrix
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare up to 3 job offers or opportunities side-by-side with algorithmic match rankings.
          </p>
        </div>

        {comparedJobs.length < 3 && (
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                const found = allJobs.find((j) => j.id === e.target.value);
                if (found) addJobToCompare(found);
              }}
              defaultValue=""
              className="bg-slate-900 border border-brand-500/40 text-brand-300 rounded-xl px-3 py-2 text-xs font-semibold"
            >
              <option value="" disabled>+ Add Job to Compare ({comparedJobs.length}/3)</option>
              {uncomparedJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.company} — {j.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Empty State */}
      {comparedJobs.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <GitCompare className="w-8 h-8 text-brand-400" />
          </div>
          <h3 className="text-lg font-bold text-white">No Jobs Selected for Comparison</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click the compare button on any job card in Search or Dashboard to compare offers, match scores, and requirements side-by-side.
          </p>
          <button
            onClick={() => setActivePage('search')}
            className="brand-gradient-btn text-white px-5 py-2.5 rounded-xl text-xs font-bold"
          >
            Explore Openings & Compare
          </button>
        </div>
      ) : (
        /* Comparison Table Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comparedJobs.map((job) => {
            const isBest = job.id === bestOptionJobId;
            const match = job.matchScore;
            const quality = job.qualityScore;

            return (
              <div
                key={job.id}
                className={`relative glass-panel rounded-3xl p-6 border transition-all ${
                  isBest
                    ? 'border-emerald-500/60 bg-slate-900/90 shadow-2xl ring-1 ring-emerald-500/30'
                    : 'border-slate-800'
                }`}
              >
                {/* Best Choice Highlight */}
                {isBest && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-lg">
                    <Sparkles className="w-3.5 h-3.5" /> Best Option For You
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => removeJobFromCompare(job.id)}
                  className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Company & Title */}
                <div className="mb-4 pr-6">
                  <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                    {job.company}
                  </span>
                  <h3 className="text-base font-bold text-white leading-snug mt-1">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{job.location}</span>
                  </div>
                </div>

                {/* Match & Quality Scores */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-brand-500/30 text-center">
                    <div className="text-xl font-extrabold text-brand-300">
                      {match?.totalScore || 80}%
                    </div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">
                      Profile Match
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                    <div className="text-xl font-extrabold text-cyan-400">
                      {quality?.score || 85}/100
                    </div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">
                      Job Quality
                    </div>
                  </div>
                </div>

                {/* Metric Breakdown Rows */}
                <div className="space-y-3.5 text-xs text-slate-300 divide-y divide-slate-800/80">
                  {/* Salary */}
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Compensation:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {job.salaryMin
                        ? `₹${(job.salaryMin / 100000).toFixed(1)}L - ₹${((job.salaryMax || job.salaryMin) / 100000).toFixed(1)}L`
                        : 'Undisclosed'}
                    </span>
                  </div>

                  {/* Skills Match */}
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Skills Compatibility:</span>
                    <span className="font-semibold text-white font-mono">
                      {match?.breakdown.skillsMatch}%
                    </span>
                  </div>

                  {/* Experience */}
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Seniority Level:</span>
                    <span className="font-semibold text-white">{job.experienceLevel}</span>
                  </div>

                  {/* Remote / Flexibility */}
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Workplace Style:</span>
                    <span className="capitalize font-semibold text-brand-300">{job.remoteType}</span>
                  </div>

                  {/* Source */}
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Application Flow:</span>
                    <span className="font-medium text-slate-300 capitalize">
                      {job.applicationType === 'direct' ? 'Direct Submission' : 'Company Website'}
                    </span>
                  </div>
                </div>

                {/* Skills Preview */}
                <div className="mt-5 mb-6">
                  <div className="text-[11px] font-bold text-slate-400 mb-2">Core Tech Stack:</div>
                  <div className="flex flex-wrap gap-1">
                    {(job.skills || []).map((sk) => (
                      <span
                        key={sk}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-2">
                  <button
                    onClick={() => onSelectJob(job)}
                    className="w-full py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-white hover:bg-slate-800 transition-all"
                  >
                    View Job Details
                  </button>

                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full brand-gradient-btn text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <span>Apply Now</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

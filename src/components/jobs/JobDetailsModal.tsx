import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  Building2, 
  IndianRupee, 
  DollarSign, 
  ExternalLink, 
  Bookmark, 
  GitCompare, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Info,
  Calendar,
  Briefcase,
  Share2,
  ChevronRight
} from 'lucide-react';
import { Job, SavedFolderType } from '../../types';
import { useSavedJobs } from '../../context/SavedJobsContext';
import { useJobComparison } from '../../context/ComparisonContext';
import { useApplications } from '../../context/ApplicationContext';
import confetti from 'canvas-confetti';

interface JobDetailsModalProps {
  job: Job | null;
  onClose: () => void;
  onOpenCompare?: () => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ job, onClose, onOpenCompare }) => {
  const { isJobSaved, saveJob, removeSavedJob } = useSavedJobs();
  const { isJobInComparison, addJobToCompare, removeJobFromCompare } = useJobComparison();
  const { applications, createApplication } = useApplications();

  const [isApplying, setIsApplying] = useState(false);
  const [trackedSuccess, setTrackedSuccess] = useState(false);

  if (!job) return null;

  const saved = isJobSaved(job.id);
  const inComparison = isJobInComparison(job.id);
  const match = job.matchScore;
  const quality = job.qualityScore;
  const skillGap = job.skillGap;

  const existingApp = applications.find((a) => a.jobId === job.id);

  const handleTrackApplication = async () => {
    await createApplication({
      jobId: job.id,
      companyName: job.company,
      jobTitle: job.title,
      status: 'applied',
      location: job.location,
      notes: `Applied via ${job.source === 'direct' ? 'RoleSpire Direct Apply' : job.source} on ${new Date().toLocaleDateString()}`,
    }, job);
    
    setTrackedSuccess(true);
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    setTimeout(() => setTrackedSuccess(false), 3000);
  };

  const handleApplyRedirect = () => {
    // Also prompt tracking
    if (!existingApp) {
      createApplication({
        jobId: job.id,
        companyName: job.company,
        jobTitle: job.title,
        status: 'applied',
        location: job.location,
        notes: `Applied on company website (${job.applyUrl})`,
      }, job);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl glass-dropdown rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/80 my-8 max-h-[92vh] overflow-y-auto">
        {/* Top Floating Controls */}
        <div className="sticky -top-2 z-10 flex items-center justify-between pb-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 -mx-6 -mt-6 px-6 pt-6 mb-6 rounded-t-3xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Job Intelligence Spec
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-brand-400 font-mono">ID: {job.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (inComparison) removeJobFromCompare(job.id);
                else {
                  addJobToCompare(job);
                  if (onOpenCompare) onOpenCompare();
                }
              }}
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
                inComparison
                  ? 'bg-brand-500 text-white border-brand-400'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span className="hidden sm:inline">{inComparison ? 'In Comparison' : 'Compare'}</span>
            </button>

            <button
              onClick={() => {
                if (saved) removeSavedJob(job.id);
                else saveJob(job.id);
              }}
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
                saved
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Header */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0 overflow-hidden">
              {job.companyLogo ? (
                <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
              ) : (
                <span>{job.company.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                {job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-sm text-slate-300">
                <span className="font-bold text-brand-300">{job.company}</span>
                {job.companyDomain && (
                  <span className="text-xs text-slate-400 font-mono">({job.companyDomain})</span>
                )}
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-xs text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {job.location}
                </span>
              </div>
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {match && (
              <div className="flex-1 md:flex-initial p-3.5 rounded-2xl bg-gradient-to-br from-brand-950/70 to-slate-900 border border-brand-500/40 text-center min-w-[120px]">
                <div className="text-2xl font-extrabold text-brand-300">{match.totalScore}%</div>
                <div className="text-[11px] font-semibold text-brand-400 tracking-wide uppercase">
                  {match.tier}
                </div>
              </div>
            )}

            {quality && (
              <div className="flex-1 md:flex-initial p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-center min-w-[120px]">
                <div className="text-2xl font-extrabold text-cyan-400">{quality.score}/100</div>
                <div className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase">
                  Job Quality
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 1: Detailed Match Score Breakdown */}
        {match && (
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-brand-500/30 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-400" />
                <h2 className="text-base font-bold text-white">Why You’re a Match</h2>
              </div>
              <span className="text-xs text-brand-300 font-mono">
                Multidimensional Profile Fit
              </span>
            </div>

            {/* Score Bars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-4">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-400">Skills Match</span>
                  <span className="text-emerald-400 font-bold">{match.breakdown.skillsMatch}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${match.breakdown.skillsMatch}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-400">Experience</span>
                  <span className="text-cyan-400 font-bold">{match.breakdown.experienceMatch}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full transition-all" style={{ width: `${match.breakdown.experienceMatch}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-400">Location</span>
                  <span className="text-indigo-400 font-bold">{match.breakdown.locationMatch}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${match.breakdown.locationMatch}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-400">Salary Fit</span>
                  <span className="text-amber-400 font-bold">{match.breakdown.salaryMatch}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${match.breakdown.salaryMatch}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-400">Work Style</span>
                  <span className="text-rose-400 font-bold">{match.breakdown.preferenceMatch}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full transition-all" style={{ width: `${match.breakdown.preferenceMatch}%` }} />
                </div>
              </div>
            </div>

            {/* Reasons List */}
            <div className="space-y-1.5">
              {match.reasons.map((reason, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Skill Gap Analysis */}
        {skillGap && (
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/70 border border-slate-800 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Skill Alignment & Gap Analysis</span>
              </h2>
              <span className="text-xs bg-brand-500/20 text-brand-300 px-2.5 py-0.5 rounded-full font-semibold">
                {skillGap.matchPercentage}% Tech Stack Alignment
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Matched Skills */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-900/30">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Your Matching Skills ({skillGap.matchedSkills.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skillGap.matchedSkills.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No exact skill keywords matched.</span>
                  ) : (
                    skillGap.matchedSkills.map((sk) => (
                      <span key={sk} className="text-xs px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                        ✓ {sk}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Missing / Weak Skills */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-900/30">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Missing / Bonus Skills ({skillGap.missingSkills.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skillGap.missingSkills.length === 0 ? (
                    <span className="text-xs text-emerald-400 font-medium">You have 100% of required technical skills!</span>
                  ) : (
                    skillGap.missingSkills.map((sk) => (
                      <span key={sk} className="text-xs px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                        ⚠ {sk}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recommendation Box */}
            <div className="p-3.5 rounded-2xl bg-brand-950/30 border border-brand-500/30 flex items-start gap-2.5 text-xs text-brand-200">
              <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
              <span>{skillGap.recommendationText}</span>
            </div>
          </div>
        )}

        {/* Section 3: Job Quality Breakdown */}
        {quality && (
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/70 border border-slate-800 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <span>Why This Job Scores High</span>
              </h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {quality.tier} ({quality.score}/100)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              {quality.reasons.map((r, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Description, Requirements, Benefits */}
        <div className="space-y-6 mb-8 text-sm text-slate-300">
          <div>
            <h3 className="text-base font-bold text-white mb-2">Role Overview</h3>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-white mb-3">Key Requirements & Experience</h3>
              <ul className="space-y-2">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-2 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.benefits && job.benefits.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-white mb-3">Benefits & Perks</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {job.benefits.map((ben, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                    <span className="text-emerald-400">✦</span>
                    <span>{ben}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Application Transparency Disclaimer & CTA Actions */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 -mx-6 -mb-6 p-6 rounded-b-3xl space-y-4">
          {/* Transparency Disclaimer */}
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Application Provider:</span>
              <span className="font-bold text-white capitalize">{job.source}</span>
            </div>
            <div>
              {job.applicationType === 'direct' ? (
                <span className="text-emerald-400 font-medium">Direct In-Platform Submission</span>
              ) : (
                <span className="text-amber-300 font-medium">
                  Redirects to employer's official careers site ({job.companyDomain || job.company})
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Direct or External Apply */}
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noreferrer"
              onClick={handleApplyRedirect}
              className="w-full sm:flex-1 brand-gradient-btn text-white py-3 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] transition-all text-sm"
            >
              <span>{job.applicationType === 'direct' ? 'Apply Directly Now' : 'Apply on Company Website'}</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Quick Track into Kanban */}
            <button
              onClick={handleTrackApplication}
              className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all ${
                existingApp || trackedSuccess
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{existingApp || trackedSuccess ? 'Tracked in Applications ✓' : 'Add to Application Tracker'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

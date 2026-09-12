import React from 'react';
import { GitCompare, X, ArrowRight, Sparkles } from 'lucide-react';
import { useJobComparison } from '../../context/ComparisonContext';

interface JobComparisonTrayProps {
  onOpenCompare: () => void;
}

export const JobComparisonTray: React.FC<JobComparisonTrayProps> = ({ onOpenCompare }) => {
  const { comparedJobs, removeJobFromCompare, clearComparison } = useJobComparison();

  if (comparedJobs.length === 0) return null;

  return (
    <div className="fixed bottom-16 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-in slide-in-from-bottom-4 duration-200">
      <div className="glass-dropdown rounded-3xl p-3 sm:p-4 shadow-2xl border border-brand-500/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-2xl brand-gradient-btn text-white shadow-md shrink-0">
            <GitCompare className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {comparedJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white shrink-0"
              >
                <span className="font-semibold truncate max-w-[110px]">{job.company}</span>
                <span className="text-[10px] text-brand-300 font-mono">
                  {job.matchScore?.totalScore || 80}%
                </span>
                <button
                  onClick={() => removeJobFromCompare(job.id)}
                  className="p-0.5 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={clearComparison}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 rounded-lg"
          >
            Clear
          </button>

          <button
            onClick={onOpenCompare}
            className="brand-gradient-btn text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-lg hover:scale-105 transition-all"
          >
            <span>Compare Matrix ({comparedJobs.length}/3)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  Filter, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  IndianRupee, 
  Calendar, 
  Layers, 
  Check, 
  X 
} from 'lucide-react';
import { JobFilters, JobSource, RemoteType } from '../../types';

interface JobFilterDrawerProps {
  filters: JobFilters;
  onChangeFilters: (updated: Partial<JobFilters>) => void;
  onResetFilters: () => void;
  activeCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const JobFilterDrawer: React.FC<JobFilterDrawerProps> = ({
  filters,
  onChangeFilters,
  onResetFilters,
  activeCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const remoteOptions: { id: RemoteType | 'all'; label: string }[] = [
    { id: 'all', label: 'Any Style' },
    { id: 'remote', label: '🌐 Remote' },
    { id: 'hybrid', label: '🏢 Hybrid' },
    { id: 'onsite', label: '📍 On-site' },
  ];

  const dateOptions: { id: JobFilters['datePosted']; label: string }[] = [
    { id: 'all', label: 'Any Time' },
    { id: '24h', label: '🔥 Last 24 Hours' },
    { id: '3d', label: 'Past 3 Days' },
    { id: '7d', label: 'Past 7 Days' },
    { id: '14d', label: 'Past 2 Weeks' },
  ];

  const sourceOptions: { id: JobSource | 'all'; label: string }[] = [
    { id: 'all', label: 'All Sources' },
    { id: 'direct', label: 'Direct Apply' },
    { id: 'adzuna', label: 'Adzuna API' },
    { id: 'greenhouse', label: 'Greenhouse' },
    { id: 'lever', label: 'Lever' },
  ];

  const content = (
    <div className="space-y-6 text-slate-200 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-bold text-white">Smart Filters</span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono text-[10px]">
              {activeCount} Active
            </span>
          )}
        </div>

        {activeCount > 0 && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-brand-300 font-medium"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* 1. Intelligent Toggles */}
      <div className="space-y-2.5">
        <label className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-brand-500/40 transition-all">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-semibold text-slate-200">Only Strong Matches (80%+)</span>
          </div>
          <input
            type="checkbox"
            checked={Boolean(filters.onlyStrongMatches)}
            onChange={(e) => onChangeFilters({ onlyStrongMatches: e.target.checked })}
            className="w-4 h-4 rounded text-brand-500 focus:ring-0 bg-slate-800 border-slate-700"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-brand-500/40 transition-all">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-slate-200">Hide Applied Jobs</span>
          </div>
          <input
            type="checkbox"
            checked={Boolean(filters.hideApplied)}
            onChange={(e) => onChangeFilters({ hideApplied: e.target.checked })}
            className="w-4 h-4 rounded text-brand-500 focus:ring-0 bg-slate-800 border-slate-700"
          />
        </label>
      </div>

      {/* 2. Remote Work Style */}
      <div>
        <label className="block font-bold text-slate-300 mb-2">Workplace Flexibility</label>
        <div className="grid grid-cols-2 gap-1.5">
          {remoteOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onChangeFilters({ remoteType: opt.id })}
              className={`p-2 rounded-xl text-left font-medium transition-all ${
                (filters.remoteType || 'all') === opt.id
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 font-bold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Minimum Salary Slider */}
      <div>
        <div className="flex justify-between font-bold text-slate-300 mb-2">
          <span>Minimum Annual Salary</span>
          <span className="text-emerald-400 font-mono font-bold">
            {filters.minSalary ? `₹${(filters.minSalary / 100000).toFixed(1)} LPA+` : 'Any Salary'}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="5000000"
          step="200000"
          value={filters.minSalary || 0}
          onChange={(e) => onChangeFilters({ minSalary: Number(e.target.value) })}
          className="w-full accent-brand-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
          <span>₹0</span>
          <span>₹25 LPA</span>
          <span>₹50 LPA+</span>
        </div>
      </div>

      {/* 4. Freshness / Date Posted */}
      <div>
        <label className="block font-bold text-slate-300 mb-2 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Listing Freshness</span>
        </label>
        <div className="space-y-1">
          {dateOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onChangeFilters({ datePosted: opt.id })}
              className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all ${
                (filters.datePosted || 'all') === opt.id
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              <span>{opt.label}</span>
              {(filters.datePosted || 'all') === opt.id && <Check className="w-3.5 h-3.5 text-brand-400" />}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Job Quality Score Threshold */}
      <div>
        <div className="flex justify-between font-bold text-slate-300 mb-2">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Min Job Quality</span>
          </span>
          <span className="text-cyan-400 font-mono font-bold">
            {filters.minQualityScore ? `${filters.minQualityScore}/100+` : 'Any'}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="95"
          step="5"
          value={filters.minQualityScore || 0}
          onChange={(e) => onChangeFilters({ minQualityScore: Number(e.target.value) })}
          className="w-full accent-cyan-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
        />
      </div>

      {/* 6. Source Provider */}
      <div>
        <label className="block font-bold text-slate-300 mb-2">Job Source</label>
        <div className="grid grid-cols-2 gap-1.5">
          {sourceOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onChangeFilters({ source: opt.id })}
              className={`p-2 rounded-xl text-left text-[11px] font-medium transition-all truncate ${
                (filters.source || 'all') === opt.id
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 font-semibold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-24 glass-panel rounded-3xl p-5 border border-slate-800/80 max-h-[calc(100vh-7rem)] overflow-y-auto">
          {content}
        </div>
      </div>

      {/* Mobile Drawer Modal */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full sm:max-w-lg glass-dropdown rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto border border-slate-700">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <span className="text-base font-bold text-white">Filter Job Search</span>
              <button onClick={onCloseMobile} className="p-2 rounded-xl text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {content}
            <button
              onClick={onCloseMobile}
              className="w-full mt-6 brand-gradient-btn text-white py-3 rounded-2xl font-bold text-sm shadow-lg"
            >
              Apply Filters & View Results
            </button>
          </div>
        </div>
      )}
    </>
  );
};

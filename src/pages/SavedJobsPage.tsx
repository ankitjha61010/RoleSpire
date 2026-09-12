import React, { useState } from 'react';
import { 
  Bookmark, 
  FolderPlus, 
  Sparkles, 
  Flame, 
  Clock, 
  Trash2, 
  Folder, 
  Plus, 
  X,
  FileText,
  ChevronRight
} from 'lucide-react';
import { Job, SavedFolderType } from '../types';
import { useSavedJobs } from '../context/SavedJobsContext';
import { JobCard } from '../components/jobs/JobCard';
import { NavPage } from '../components/layout/Navbar';

interface SavedJobsPageProps {
  allJobs: Job[];
  onSelectJob: (job: Job) => void;
  setActivePage: (page: NavPage) => void;
}

export const SavedJobsPage: React.FC<SavedJobsPageProps> = ({
  allJobs,
  onSelectJob,
  setActivePage,
}) => {
  const { 
    savedRecords, 
    customFolders, 
    removeSavedJob, 
    createCustomFolder, 
    deleteCustomFolder,
    updateSavedJobNote
  } = useSavedJobs();

  const [activeFolder, setActiveFolder] = useState<SavedFolderType | string>('all');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('#6366f1');

  // Filter saved records
  const filteredRecords = savedRecords.filter((rec) => {
    if (activeFolder === 'all') return true;
    if (activeFolder === rec.folderType) return true;
    if (activeFolder === rec.folderId) return true;
    return false;
  });

  const savedJobsWithRecords = filteredRecords
    .map((rec) => ({
      job: allJobs.find((j) => j.id === rec.jobId),
      record: rec,
    }))
    .filter((item): item is { job: Job; record: typeof item.record } => item.job !== undefined);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    createCustomFolder(folderName, folderColor);
    setFolderName('');
    setShowNewFolderModal(false);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Smart Folders & Bookmarks
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize your shortlisted opportunities across custom smart folders and priority tags.
          </p>
        </div>

        <button
          onClick={() => setShowNewFolderModal(true)}
          className="brand-gradient-btn text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Custom Folder</span>
        </button>
      </div>

      {/* Folders Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveFolder('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeFolder === 'all'
              ? 'brand-gradient-btn text-white shadow-md'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>All Saved ({savedRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveFolder('dream_jobs')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeFolder === 'dream_jobs'
              ? 'brand-gradient-btn text-white shadow-md'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>Dream Jobs</span>
        </button>

        <button
          onClick={() => setActiveFolder('high_priority')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeFolder === 'high_priority'
              ? 'brand-gradient-btn text-white shadow-md'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>High Priority</span>
        </button>

        <button
          onClick={() => setActiveFolder('apply_later')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeFolder === 'apply_later'
              ? 'brand-gradient-btn text-white shadow-md'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Apply Later</span>
        </button>

        {/* Custom folders */}
        {customFolders.map((cf) => (
          <div key={cf.id} className="relative group shrink-0">
            <button
              onClick={() => setActiveFolder(cf.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                activeFolder === cf.id
                  ? 'bg-slate-800 text-white border border-brand-500/60 shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cf.color }} />
              <span>{cf.name}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Content */}
      {savedJobsWithRecords.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Bookmark className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-white">No Jobs in This Folder</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Save interesting job listings from Search or For You page to organize and review later.
          </p>
          <button
            onClick={() => setActivePage('search')}
            className="brand-gradient-btn text-white px-5 py-2.5 rounded-xl text-xs font-bold"
          >
            Find Jobs to Save
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {savedJobsWithRecords.map(({ job, record }) => (
            <div key={job.id} className="space-y-2">
              <JobCard job={job} onSelectJob={onSelectJob} />
              
              {/* Optional Custom Note Banner */}
              {record.notes && (
                <div className="px-5 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
                  <FileText className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <span className="text-slate-400 font-semibold">Your Note:</span>
                  <span className="text-slate-200">{record.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md glass-dropdown rounded-3xl p-6 shadow-2xl border border-slate-700">
            <button
              onClick={() => setShowNewFolderModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-4">Create Smart Folder</h2>

            <form onSubmit={handleCreateFolder} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Folder Name *</label>
                <input
                  type="text"
                  required
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g. Frontend Leads, YC Startups"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Color Tag</label>
                <div className="flex items-center gap-3">
                  {['#6366f1', '#06b6d4', '#10b981', '#f43f5e', '#f59e0b', '#ec4899', '#8b5cf6'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFolderColor(color)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        folderColor === color ? 'scale-125 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full brand-gradient-btn text-white py-3 rounded-2xl font-bold text-xs shadow-lg mt-2"
              >
                Create Folder
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

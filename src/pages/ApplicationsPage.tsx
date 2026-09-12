import React, { useEffect, useRef, useState } from 'react';
import { 
  Layers, 
  Plus, 
  LayoutGrid, 
  List, 
  Calendar, 
  Clock, 
  Trash2, 
  Bell, 
  X,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Application, ApplicationEventType, ApplicationStatus } from '../types';
import { useApplications } from '../context/ApplicationContext';
import { Pagination } from '../components/common/Pagination';
import confetti from 'canvas-confetti';

const APPLICATIONS_PAGE_SIZE = 10;

const STATUS_COLUMNS: { id: ApplicationStatus; label: string; color: string; badgeBg: string }[] = [
  { id: 'saved', label: 'Saved Leads', color: 'text-slate-300', badgeBg: 'bg-slate-800' },
  { id: 'applied', label: 'Applied', color: 'text-blue-400', badgeBg: 'bg-blue-500/20' },
  { id: 'assessment', label: 'Assessment', color: 'text-purple-400', badgeBg: 'bg-purple-500/20' },
  { id: 'interview', label: 'Interview', color: 'text-amber-400', badgeBg: 'bg-amber-500/20' },
  { id: 'offer', label: 'Offer Received', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/20' },
  { id: 'rejected', label: 'Archived', color: 'text-rose-400', badgeBg: 'bg-rose-500/20' },
];

export const ApplicationsPage: React.FC = () => {
  const { 
    applications, 
    createApplication, 
    updateApplicationStatus, 
    updateApplication, 
    deleteApplication,
    addTimelineEvent,
    getApplicationEvents,
    setFollowUpReminder,
  } = useApplications();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [appsPage, setAppsPage] = useState(1);
  const appsTableScrollRef = useRef<HTMLDivElement>(null);
  const handleAppsPageChange = (p: number) => {
    setAppsPage(p);
    appsTableScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const totalAppsPages = Math.max(1, Math.ceil(applications.length / APPLICATIONS_PAGE_SIZE));
  const pagedApplications = applications.slice(
    (appsPage - 1) * APPLICATIONS_PAGE_SIZE,
    appsPage * APPLICATIONS_PAGE_SIZE
  );

  // Clamp back to the last valid page if applications shrink (e.g. after a delete)
  useEffect(() => {
    if (appsPage > totalAppsPages) setAppsPage(totalAppsPages);
  }, [appsPage, totalAppsPages]);

  // New Application Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('applied');
  const [newSalary, setNewSalary] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Event creation inside modal
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<ApplicationEventType>('technical_interview');
  const [eventDesc, setEventDesc] = useState('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim()) return;

    await createApplication({
      jobTitle: newTitle,
      companyName: newCompany,
      status: newStatus,
      salaryOffered: newSalary,
      notes: newNotes,
    });

    setNewTitle('');
    setNewCompany('');
    setNewSalary('');
    setNewNotes('');
    setShowCreateModal(false);
  };

  const handleAddEvent = async () => {
    if (!selectedApp || !eventTitle.trim()) return;
    await addTimelineEvent(selectedApp.id, eventType, eventTitle, eventDesc);
    setEventTitle('');
    setEventDesc('');
  };

  const handleSetReminder = async (days: number) => {
    if (!selectedApp) return;
    await setFollowUpReminder(selectedApp.id, days);
    confetti({ particleCount: 30, spread: 40 });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Compact Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel rounded-2xl p-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            <h1 className="text-base sm:text-lg font-bold text-white">
              Application Tracker
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 font-mono font-medium border border-slate-800">
              {applications.length} Total
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Manage your hiring pipeline, interview stages, and follow-up reminders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="bg-slate-900 p-0.5 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="brand-gradient-btn text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:scale-105 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Application</span>
          </button>
        </div>
      </div>

      {/* Kanban Board with Smooth Horizontal Swimlane on All Screen Sizes */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4 -mx-3 sm:mx-0 px-3 sm:px-0">
          <div className="flex gap-3 min-w-[900px] lg:min-w-full">
            {STATUS_COLUMNS.map((col) => {
              const colApps = applications.filter((a) => a.status === col.id);
              return (
                <div
                  key={col.id}
                  className="flex-1 min-w-[210px] glass-panel rounded-2xl p-3 border border-slate-800/80 bg-slate-900/40 flex flex-col"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800/80">
                    <span className={`text-xs font-bold ${col.color}`}>{col.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold text-slate-300 ${col.badgeBg}`}>
                      {colApps.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2 flex-1 min-h-[180px] max-h-[calc(100vh-22rem)] overflow-y-auto pr-1 -mr-1">
                    {colApps.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className="group p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-brand-500/40 cursor-pointer transition-all shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-[11px] font-bold text-brand-300 truncate">
                            {app.companyName}
                          </span>
                          {app.matchScore && (
                            <span className="text-[9px] font-mono px-1 rounded bg-brand-500/20 text-brand-300 shrink-0">
                              {app.matchScore}%
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-semibold text-white leading-tight line-clamp-2 mb-1.5 group-hover:text-brand-300 transition-colors">
                          {app.jobTitle}
                        </h4>

                        {app.salaryOffered && (
                          <div className="text-[10px] font-mono text-emerald-400 font-semibold mb-1.5 truncate">
                            {app.salaryOffered}
                          </div>
                        )}

                        {/* Reminder alert tag */}
                        {app.followUpDate && (
                          <div className="flex items-center gap-1 text-[9px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded mb-1.5">
                            <Bell className="w-2.5 h-2.5" />
                            <span>Follow up: {new Date(app.followUpDate).toLocaleDateString()}</span>
                          </div>
                        )}

                        {/* Status Select */}
                        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px]">
                          <span className="text-slate-500 font-mono">
                            {new Date(app.appliedAt).toLocaleDateString()}
                          </span>

                          <select
                            value={app.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateApplicationStatus(app.id, e.target.value as ApplicationStatus)}
                            className="bg-slate-950 text-slate-300 text-[9px] rounded px-1 py-0.5 border border-slate-800"
                          >
                            <option value="saved">Saved</option>
                            <option value="applied">Applied</option>
                            <option value="assessment">Assessment</option>
                            <option value="interview">Interview</option>
                            <option value="offer">Offer</option>
                            <option value="rejected">Archived</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    {colApps.length === 0 && (
                      <div className="h-24 border border-dashed border-slate-800/60 rounded-xl flex items-center justify-center text-[10px] text-slate-500 italic">
                        No entries
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="glass-panel rounded-2xl border border-slate-800 shadow-md">
          <div ref={appsTableScrollRef} className="overflow-auto h-[min(70vh,640px)]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Company & Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Compensation</th>
                <th className="p-3">Applied Date</th>
                <th className="p-3">Follow-Up</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {pagedApplications.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="p-3">
                    <div className="font-bold text-white text-xs">{app.jobTitle}</div>
                    <div className="text-brand-300 font-semibold text-[11px]">{app.companyName}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-semibold capitalize">
                      {app.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-emerald-400 text-[11px]">
                    {app.salaryOffered || '—'}
                  </td>
                  <td className="p-3 text-slate-400 text-[11px] font-mono">
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-amber-300 font-medium text-[11px]">
                    {app.followUpDate ? new Date(app.followUpDate).toLocaleDateString() : 'None'}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteApplication(app.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="p-3 border-t border-slate-800">
            <Pagination currentPage={appsPage} totalPages={totalAppsPages} onPageChange={handleAppsPageChange} />
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl glass-dropdown rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-700 max-h-[85vh] overflow-y-auto text-xs">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4 pr-6">
              <div>
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                  {selectedApp.companyName}
                </span>
                <h2 className="text-lg font-bold text-white leading-tight">
                  {selectedApp.jobTitle}
                </h2>
              </div>

              <select
                value={selectedApp.status}
                onChange={(e) => {
                  const newSt = e.target.value as ApplicationStatus;
                  updateApplicationStatus(selectedApp.id, newSt);
                  setSelectedApp({ ...selectedApp, status: newSt });
                }}
                className="bg-slate-900 border border-brand-500/40 text-brand-300 rounded-xl px-2.5 py-1 text-xs font-semibold"
              >
                <option value="saved">Saved Lead</option>
                <option value="applied">Applied</option>
                <option value="assessment">Technical Assessment</option>
                <option value="interview">Interview Stage</option>
                <option value="offer">Offer Received</option>
                <option value="rejected">Archived</option>
              </select>
            </div>

            {/* Follow-up Reminder Action Bar */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px]">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-300 font-semibold">Set Follow-up Reminder:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleSetReminder(3)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200"
                >
                  3 Days
                </button>
                <button
                  onClick={() => handleSetReminder(7)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200"
                >
                  7 Days
                </button>
                <button
                  onClick={() => handleSetReminder(14)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200"
                >
                  14 Days
                </button>
              </div>
            </div>

            {/* Notes Section */}
            <div className="mb-4 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">Application Notes</label>
              <textarea
                value={selectedApp.notes || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedApp({ ...selectedApp, notes: val });
                  updateApplication(selectedApp.id, { notes: val });
                }}
                rows={2}
                placeholder="Add notes, recruiter contact, interview feedback..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
              />
            </div>

            {/* Timeline */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-400" />
                <span>Timeline Milestones</span>
              </h3>

              <div className="space-y-2 pl-3 border-l-2 border-brand-500/30">
                {getApplicationEvents(selectedApp.id).map((ev) => (
                  <div key={ev.id} className="relative text-[11px]">
                    <div className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-brand-500 border-2 border-slate-900" />
                    <div className="flex items-center justify-between font-semibold text-white">
                      <span>{ev.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(ev.eventDate).toLocaleDateString()}
                      </span>
                    </div>
                    {ev.description && (
                      <p className="text-slate-400 text-[10px]">{ev.description}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Custom Event */}
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-center gap-2">
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as ApplicationEventType)}
                  className="w-full sm:w-auto bg-slate-900 border border-slate-800 text-slate-300 text-[11px] rounded-lg px-2 py-1.5"
                >
                  <option value="technical_interview">Tech Round</option>
                  <option value="hr_interview">HR Screen</option>
                  <option value="assessment">Assignment</option>
                  <option value="offer_received">Offer</option>
                  <option value="note_added">Note</option>
                </select>

                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. System Design Round"
                  className="w-full flex-1 bg-slate-900 border border-slate-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                />

                <button
                  onClick={handleAddEvent}
                  className="w-full sm:w-auto brand-gradient-btn text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Application Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md glass-dropdown rounded-2xl p-5 shadow-2xl border border-slate-700">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-base font-bold text-white mb-3">Track New Job Application</h2>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Target Role Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. React Native Engineer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="e.g. Google, Stripe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    <option value="applied">Applied</option>
                    <option value="assessment">Assessment</option>
                    <option value="interview">Interview</option>
                    <option value="saved">Saved Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Salary</label>
                  <input
                    type="text"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    placeholder="e.g. ₹24 LPA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full brand-gradient-btn text-white py-2.5 rounded-xl font-bold text-xs shadow-md mt-2"
              >
                Create Application
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

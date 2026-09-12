import React, { useMemo, useState } from 'react';
import { 
  Bell, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  IndianRupee, 
  Globe, 
  X,
  Sparkles
} from 'lucide-react';
import { useJobAlerts } from '../context/AlertsContext';
import { ScrollablePaginatedList } from '../components/common/ScrollablePaginatedList';
import confetti from 'canvas-confetti';

const ALERTS_PAGE_SIZE = 10;

export const AlertsPage: React.FC = () => {
  const { alerts, createAlert, toggleAlert, deleteAlert } = useJobAlerts();
  const [showModal, setShowModal] = useState(false);
  const [alertsPage, setAlertsPage] = useState(1);
  const totalAlertsPages = Math.max(1, Math.ceil(alerts.length / ALERTS_PAGE_SIZE));
  const pagedAlerts = useMemo(
    () => alerts.slice((alertsPage - 1) * ALERTS_PAGE_SIZE, alertsPage * ALERTS_PAGE_SIZE),
    [alerts, alertsPage]
  );

  // New alert form
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('React, TypeScript');
  const [location, setLocation] = useState('Ahmedabad');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minSalary, setMinSalary] = useState(1500000);
  const [frequency, setFrequency] = useState<'instant' | 'daily' | 'weekly'>('daily');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createAlert({
      title,
      keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
      location: location || undefined,
      remoteOnly,
      minSalary: minSalary > 0 ? minSalary : undefined,
      frequency,
      isActive: true,
    });

    setTitle('');
    setShowModal(false);
    confetti({ particleCount: 35, spread: 50 });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Instant Job Alerts & Notifications
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure automated alerts to get notified the second high-match opportunities go live.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="brand-gradient-btn text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Alert</span>
        </button>
      </div>

      {/* Alerts Grid */}
      {alerts.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Bell className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-white">No Alerts Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Create an alert to get notified when a high-match opportunity goes live.
          </p>
        </div>
      ) : (
      <ScrollablePaginatedList
        currentPage={alertsPage}
        totalPages={totalAlertsPages}
        onPageChange={setAlertsPage}
        listClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {pagedAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`glass-panel rounded-3xl p-5 border transition-all ${
              alert.isActive ? 'border-brand-500/40' : 'border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-mono ${
                  alert.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {alert.isActive ? '● Active Alert' : '○ Paused'}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white mt-1.5 leading-snug">
                  {alert.title}
                </h3>
              </div>

              <button
                onClick={() => deleteAlert(alert.id)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Criteria */}
            <div className="space-y-1.5 text-xs text-slate-300 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Keywords:</span>
                <span className="font-semibold text-white">{alert.keywords.join(', ')}</span>
              </div>

              {alert.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{alert.location}</span>
                </div>
              )}

              {alert.minSalary && (
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-semibold">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>₹{(alert.minSalary / 100000).toFixed(1)} LPA+</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>Frequency: <strong className="text-slate-300 capitalize">{alert.frequency}</strong></span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => toggleAlert(alert.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                  alert.isActive
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-brand-500 text-white shadow-sm'
                }`}
              >
                {alert.isActive ? 'Pause Alert' : 'Activate Alert'}
              </button>

              <span className="text-[10px] text-slate-500 font-mono">
                Created {new Date(alert.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </ScrollablePaginatedList>
      )}

      {/* Create Alert Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg glass-dropdown rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-4">Create Smart Job Alert</h2>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Alert Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior React Developer in Ahmedabad"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Target Keywords (Comma Separated)</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="React, TypeScript, Node.js"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Preferred Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Ahmedabad, Bangalore"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Min Salary (INR)</label>
                  <input
                    type="number"
                    step="100000"
                    value={minSalary}
                    onChange={(e) => setMinSalary(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remoteOnly"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="rounded text-brand-500 focus:ring-0 bg-slate-900 border-slate-700"
                />
                <label htmlFor="remoteOnly" className="text-slate-300 font-medium">
                  Only notify me about 100% Remote positions
                </label>
              </div>

              <button
                type="submit"
                className="w-full brand-gradient-btn text-white py-3 rounded-2xl font-bold text-xs shadow-lg mt-2"
              >
                Save & Activate Job Alert
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

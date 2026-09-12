import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import confetti from 'canvas-confetti';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copySqlSnippet = () => {
    fetch('/supabase/schema.sql')
      .then((res) => (res.ok ? res.text() : ''))
      .catch(() => '')
      .then((sql) => {
        const textToCopy = sql || '-- Run schema.sql from your project supabase/schema.sql file';
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        setTimeout(() => setCopied(false), 2500);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl glass-dropdown rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/80 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              RoleSpire Backend Architecture
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-xs text-slate-300">
                {isSupabaseConfigured
                  ? 'Connected to Live Supabase Project'
                  : 'Zero-Setup Local Mode Active (Seamlessly testable now)'}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          This platform is architected strictly **frontend-first** with direct integration to **Supabase Auth, PostgreSQL, and Storage**. All Row-Level Security (RLS) policies and schemas are pre-configured.
        </p>

        {/* Status Box */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 mb-6 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">PostgreSQL Database</span>
            <span className="text-emerald-400 font-mono font-semibold">Ready (schema.sql)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Row Level Security (RLS)</span>
            <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Enforced
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Supabase Auth</span>
            <span className="text-cyan-400 font-mono font-semibold">Email / Magic Link / JWT</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Resume Storage Bucket</span>
            <span className="text-indigo-400 font-mono font-semibold">resumes/</span>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-4 mb-6 text-xs text-slate-300">
          <h3 className="text-sm font-semibold text-white">To connect your live Supabase database:</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-300">
            <li>
              Create a free project on{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-brand-400 hover:underline inline-flex items-center gap-1 font-medium"
              >
                supabase.com <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              Open the <strong>SQL Editor</strong> in your Supabase dashboard and run{' '}
              <code className="bg-slate-800 text-brand-300 px-1 py-0.5 rounded">supabase/schema.sql</code>.
            </li>
            <li>
              Add your credentials to your project <code className="bg-slate-800 text-brand-300 px-1 py-0.5 rounded">.env.local</code>:
              <pre className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto">
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
              </pre>
            </li>
          </ol>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copySqlSnippet}
            className="flex-1 brand-gradient-btn text-white py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" /> SQL Schema Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy SQL Schema (schema.sql)
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

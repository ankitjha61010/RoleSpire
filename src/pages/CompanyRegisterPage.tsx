import React, { useEffect, useState } from 'react';
import { Building2, Globe, MapPin, Loader2, ArrowLeft, Plus, ShieldCheck, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { uploadImage } from '../lib/storage';

interface CompanyRegisterPageProps {
  onBack: () => void;
  onManageCompany: (companyId: string) => void;
}

interface MyCompany {
  id: string;
  name: string;
  logoUrl?: string;
  industry?: string;
}

const emptyForm = {
  name: '',
  industry: '',
  hqLocation: '',
  website: '',
  about: '',
  companySize: '',
  foundedYear: '',
  logoUrl: '',
};

export const CompanyRegisterPage: React.FC<CompanyRegisterPageProps> = ({ onBack, onManageCompany }) => {
  const { profile, isRealSession } = useAuth();
  const [myCompanies, setMyCompanies] = useState<MyCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const loadMyCompanies = async () => {
    if (!supabase || !profile) {
      setIsLoading(false);
      return;
    }
    const { data } = await supabase
      .from('company_members')
      .select('company_id, companies(id, name, logo_url, industry)')
      .eq('user_id', profile.id)
      .eq('role', 'admin');

    setMyCompanies(
      (data || [])
        .map((row: any) => row.companies)
        .filter(Boolean)
        .map((c: any) => ({ id: c.id, name: c.name, logoUrl: c.logo_url, industry: c.industry }))
    );
    setIsLoading(false);
  };

  useEffect(() => {
    loadMyCompanies();
  }, [profile?.id]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !profile || !form.name.trim()) return;
    setIsSubmitting(true);
    setError('');

    const slug = `${form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`;

    const { data, error: insertError } = await supabase
      .from('companies')
      .insert({
        name: form.name.trim(),
        slug,
        logo_url: form.logoUrl || null,
        industry: form.industry.trim() || null,
        hq_location: form.hqLocation.trim() || null,
        website: form.website.trim() || null,
        about: form.about.trim() || null,
        company_size: form.companySize.trim() || null,
        founded_year: form.foundedYear ? Number(form.foundedYear) : null,
        created_by: profile.id,
      })
      .select('id')
      .single();

    setIsSubmitting(false);

    if (insertError || !data) {
      setError(insertError?.message || 'Could not register this company. Please try again.');
      return;
    }

    setForm(emptyForm);
    setShowForm(false);
    onManageCompany(data.id);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setIsUploadingLogo(true);
    const result = await uploadImage('profile-media', profile.id, file, 'company_logo');
    setForm((f) => ({ ...f, logoUrl: result.url }));
    setIsUploadingLogo(false);
  };

  if (!isRealSession) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
        <p className="text-slate-400 text-sm">Sign in with a real account to register or manage a company.</p>
        <button onClick={onBack} className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors font-medium text-sm inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 animate-fadeIn pb-24">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-medium shadow-sm group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back</span>
      </button>

      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-brand-400" />
          Register / Manage Company
        </h1>
        <p className="text-xs text-slate-400">
          Register your company to get an admin-managed page and post jobs directly on RoleSpire.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8"><Loader2 className="w-5 h-5 text-brand-400 animate-spin mx-auto" /></div>
      ) : (
        <>
          {myCompanies.length > 0 && (
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Companies You Manage</h3>
              {myCompanies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onManageCompany(c.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-brand-500/40 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-brand-300 shrink-0 overflow-hidden">
                    {c.logoUrl ? <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover" /> : c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm truncate">{c.name}</p>
                    {c.industry && <p className="text-[11px] text-slate-400">{c.industry}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 rounded-2xl border border-dashed border-slate-700 hover:border-brand-500/60 text-slate-300 hover:text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Register a New Company
            </button>
          ) : (
            <form onSubmit={handleRegister} className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3 text-xs">
              {error && <p className="text-rose-400">{error}</p>}

              <div className="flex items-center gap-3">
                <label className="relative w-14 h-14 rounded-xl bg-slate-900 border border-dashed border-slate-700 hover:border-brand-500/60 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden transition-all">
                  {isUploadingLogo ? (
                    <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                  ) : form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-5 h-5 text-slate-500" />
                  )}
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
                <div className="text-slate-400 text-[11px]">
                  <p className="font-semibold text-slate-300">Company logo</p>
                  <p>Optional — helps your page stand out in search.</p>
                </div>
              </div>

              <input required placeholder="Company name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input placeholder="HQ Location" value={form.hqLocation} onChange={(e) => setForm({ ...form, hqLocation: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white" />
                </div>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input placeholder="Website (https://...)" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white" />
                </div>
                <input placeholder="Company size (e.g. 51-200)" value={form.companySize} onChange={(e) => setForm({ ...form, companySize: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                <input type="number" placeholder="Founded year" value={form.foundedYear} onChange={(e) => setForm({ ...form, foundedYear: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white sm:col-span-2" />
              </div>
              <textarea placeholder="About the company" value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} rows={3} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
              <div className="flex items-center gap-2 pt-1">
                <button type="submit" disabled={isSubmitting} className="brand-gradient-btn text-white py-2 px-5 rounded-xl font-bold disabled:opacity-50">
                  {isSubmitting ? 'Registering...' : 'Register Company'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};

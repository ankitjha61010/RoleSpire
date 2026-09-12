import React, { useEffect, useState } from 'react';
import {
  User,
  UploadCloud,
  Plus,
  X,
  Check,
  Save,
  FileText,
  Sparkles,
  Briefcase,
  GraduationCap,
  Award,
  FolderGit2,
  Camera,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfileSections } from '../context/ProfileSectionsContext';
import { uploadResumeFile, uploadImage } from '../lib/storage';
import { UserRoleBadge } from '../components/common/UserRoleBadge';
import { UserRole, UserBadgeStatus } from '../types';
import { supabase } from '../lib/supabaseClient';
import confetti from 'canvas-confetti';

interface CompanyOption {
  id: string;
  name: string;
}

export const ProfilePage: React.FC = () => {
  const { profile, updateProfile, addSkill, removeSkill, isRealSession } = useAuth();
  const {
    experiences, education, certifications, projects,
    addExperience, removeExperience,
    addEducation, removeEducation,
    addCertification, removeCertification,
    addProject, removeProject,
  } = useProfileSections();

  // Form states
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [role, setRole] = useState<UserRole>(profile?.role || 'job_seeker');
  const [badgeStatus, setBadgeStatus] = useState<UserBadgeStatus>(profile?.badgeStatus || 'open_to_work');
  const [company, setCompany] = useState(profile?.company || '');
  const [companyId, setCompanyId] = useState(profile?.companyId);
  const [companyResults, setCompanyResults] = useState<CompanyOption[]>([]);
  const [experienceYears, setExperienceYears] = useState(profile?.experienceYears || 3.5);
  const [currentLocation, setCurrentLocation] = useState(profile?.currentLocation || 'Ahmedabad, India');
  const [expectedSalaryMin, setExpectedSalaryMin] = useState(profile?.expectedSalaryMin || 1600000);
  const [remotePreference, setRemotePreference] = useState(profile?.remotePreference || 'open');

  // New Skill Input
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillYears, setNewSkillYears] = useState(3.0);
  const [newSkillProficiency, setNewSkillProficiency] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('advanced');

  // Resume state
  const [isUploading, setIsUploading] = useState(false);
  const [resumeFileName, setResumeFileName] = useState(profile?.resumeFileName || 'Abhishek_Kashyap_Resume.pdf');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New Experience/Education/Certification/Project form states
  const [showExpForm, setShowExpForm] = useState(false);
  const [expForm, setExpForm] = useState({ title: '', companyName: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });
  const [showEduForm, setShowEduForm] = useState(false);
  const [eduForm, setEduForm] = useState({ schoolName: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' });
  const [showCertForm, setShowCertForm] = useState(false);
  const [certForm, setCertForm] = useState({ name: '', issuingOrg: '', issueDate: '', credentialUrl: '' });
  const [showProjForm, setShowProjForm] = useState(false);
  const [projForm, setProjForm] = useState({ name: '', description: '', url: '' });

  const handleCompanySearch = async (query: string) => {
    setCompany(query);
    setCompanyId(undefined);
    if (!supabase || query.trim().length < 2) {
      setCompanyResults([]);
      return;
    }
    const { data } = await supabase.from('companies').select('id, name').ilike('name', `%${query.trim()}%`).limit(5);
    setCompanyResults(data || []);
  };

  const handleCreateCompany = async () => {
    if (!supabase || !profile || !company.trim()) return;
    const slug = `${company.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from('companies')
      .insert({ name: company.trim(), slug, created_by: profile.id })
      .select('id, name')
      .single();
    if (!error && data) {
      setCompanyId(data.id);
      setCompany(data.name);
      setCompanyResults([]);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    const result = await uploadImage('profile-media', profile.id, file, 'avatar');
    await updateProfile({ avatarUrl: result.url });
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    const result = await uploadImage('profile-media', profile.id, file, 'cover');
    await updateProfile({ coverImageUrl: result.url });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      fullName,
      headline,
      bio,
      role,
      badgeStatus,
      company,
      companyId,
      experienceYears: Number(experienceYears),
      currentLocation,
      expectedSalaryMin: Number(expectedSalaryMin),
      remotePreference,
      resumeFileName,
    });

    setSavedSuccess(true);
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.title.trim() || !expForm.companyName.trim() || !expForm.startDate) return;
    await addExperience({ ...expForm, isCurrent: expForm.isCurrent });
    setExpForm({ title: '', companyName: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });
    setShowExpForm(false);
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduForm.schoolName.trim()) return;
    await addEducation(eduForm);
    setEduForm({ schoolName: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' });
    setShowEduForm(false);
  };

  const handleAddCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.name.trim()) return;
    await addCertification(certForm);
    setCertForm({ name: '', issuingOrg: '', issueDate: '', credentialUrl: '' });
    setShowCertForm(false);
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projForm.name.trim()) return;
    await addProject(projForm);
    setProjForm({ name: '', description: '', url: '' });
    setShowProjForm(false);
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    await addSkill({
      name: newSkillName.trim(),
      yearsOfExperience: Number(newSkillYears),
      proficiency: newSkillProficiency,
    });

    setNewSkillName('');
  };

  const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setIsUploading(true);
    const result = await uploadResumeFile(profile.id, file);
    setIsUploading(false);

    if (result.url) {
      setResumeFileName(file.name);
      await updateProfile({
        resumeUrl: result.url,
        resumeFileName: file.name,
      });
      confetti({ particleCount: 30, spread: 40 });
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Career Profile & Match Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Your profile parameters drive all live job match scores, skill gap recommendations, and salary alignments.
          </p>
        </div>

        <button
          onClick={handleSaveProfile}
          className="brand-gradient-btn text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
        >
          {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'Profile Saved ✓' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Avatar & Cover Photo */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div
          className="h-32 sm:h-44 w-full bg-gradient-to-r from-brand-600/30 via-purple-600/25 to-blue-600/30 relative bg-cover bg-center"
          style={profile?.coverImageUrl ? { backgroundImage: `url(${profile.coverImageUrl})` } : undefined}
        >
          <label className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700 text-white text-[11px] font-semibold cursor-pointer transition-all">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Change Cover</span>
            <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
          </label>
        </div>
        <div className="px-6 pb-6 -mt-10 flex items-end gap-4">
          <div className="relative w-20 h-20 rounded-2xl bg-slate-900 border-4 border-slate-950 shadow-xl overflow-hidden flex items-center justify-center text-white text-2xl font-extrabold shrink-0">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
            ) : (
              <span>{profile?.fullName?.charAt(0) || 'U'}</span>
            )}
            <label className="absolute inset-0 bg-slate-950/60 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
              <Camera className="w-5 h-5 text-white" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
          <p className="text-[11px] text-slate-400 pb-1">Click your photo to change it. Public and visible to other members.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Core Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-5 text-xs">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Professional Information</span>
              <UserRoleBadge role={role} badgeStatus={badgeStatus} size="sm" />
            </h2>

            {/* Role / Identity Selector (Recruiter, Job Seeker, Founder, Mentor) */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block font-bold text-white text-xs">Your Platform Role & Identity</label>
                  <p className="text-[11px] text-slate-400">Specifies whether you are hiring talent or looking for opportunities.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'job_seeker', label: '👨‍💻 Candidate / Engineer', desc: 'Seeking job openings' },
                  { id: 'recruiter', label: '🎯 Recruiter / Talent Lead', desc: 'Hiring & sourcing talent' },
                  { id: 'founder', label: '🚀 Founder / Exec', desc: 'Building core team' },
                  { id: 'mentor', label: '💡 Tech Mentor', desc: 'Sharing tips & referrals' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRole(r.id as UserRole);
                      if (r.id === 'recruiter' && badgeStatus === 'open_to_work') {
                        setBadgeStatus('hiring');
                      } else if (r.id === 'job_seeker' && badgeStatus === 'hiring') {
                        setBadgeStatus('open_to_work');
                      }
                    }}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      role === r.id
                        ? 'bg-brand-500/15 border-brand-500 text-white shadow-md ring-1 ring-brand-500/30'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <div className="font-bold text-xs">{r.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Status Photo Badge Selector (#OpenToWork, #Hiring, #OpenToRefer) */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block font-bold text-white text-xs">Public Profile Status Badge</label>
                  <p className="text-[11px] text-slate-400">Displayed on your profile photo, community feed, and chat headers.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'open_to_work', label: '✨ #OPEN TO WORK', desc: 'Visible to all recruiters' },
                  { id: 'hiring', label: '💼 #HIRING', desc: 'Actively hiring engineers' },
                  { id: 'open_to_refer', label: '🤝 #OPEN TO REFER', desc: 'Offering internal referrals' },
                  { id: 'none', label: '🚫 No Badge', desc: 'Standard profile' },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBadgeStatus(b.id as UserBadgeStatus)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      badgeStatus === b.id
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <div className="font-bold text-xs">{b.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{b.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <div className="relative">
                <label className="block font-bold text-slate-300 mb-1">
                  Company / Organization (Optional) {companyId && <span className="text-emerald-400 font-normal normal-case">· linked</span>}
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => handleCompanySearch(e.target.value)}
                  placeholder="e.g. Google, Stripe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-500 font-medium"
                />
                {(companyResults.length > 0 || (isRealSession && company.trim().length >= 2 && !companyId)) && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
                    {companyResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCompany(c.name);
                          setCompanyId(c.id);
                          setCompanyResults([]);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
                      >
                        {c.name}
                      </button>
                    ))}
                    {isRealSession && company.trim().length >= 2 && !companyId && (
                      <button
                        type="button"
                        onClick={handleCreateCompany}
                        className="w-full text-left px-3 py-2 text-xs text-brand-300 hover:bg-slate-800 border-t border-slate-800 font-semibold"
                      >
                        + Create "{company.trim()}" as a new company
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Professional Title & Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior Full Stack & Mobile Engineer"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Professional Bio & Focus</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Summary of tech stack, architectural strengths, and domain experience..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Years of Experience</label>
                <input
                  type="number"
                  step="0.5"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Current Base Location</label>
                <input
                  type="text"
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Expected Minimum Annual Salary</label>
                <input
                  type="number"
                  step="100000"
                  value={expectedSalaryMin}
                  onChange={(e) => setExpectedSalaryMin(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-emerald-400 font-mono font-bold focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-2">Remote & Workplace Preference</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'open', label: 'Open to All' },
                  { id: 'remote_only', label: '100% Remote' },
                  { id: 'hybrid', label: 'Hybrid Office' },
                  { id: 'onsite', label: 'On-site Only' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRemotePreference(opt.id as any)}
                    className={`p-2.5 rounded-xl font-semibold text-center transition-all ${
                      remotePreference === opt.id
                        ? 'bg-brand-500 text-white shadow-md'
                        : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="brand-gradient-btn text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md"
              >
                Save Profile Parameters
              </button>
            </div>
          </form>

          {/* Skills Management Section */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>Verified Skills & Competencies ({profile?.skills.length || 0})</span>
              </h2>
              <span className="text-slate-400 font-mono">Used for Skill Gap Analysis</span>
            </div>

            {/* Current Skills Chips */}
            <div className="flex flex-wrap gap-2">
              {(profile?.skills || []).map((sk) => (
                <div
                  key={sk.name}
                  className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900 border border-brand-500/40 text-brand-200 text-xs font-semibold"
                >
                  <span>{sk.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({sk.yearsOfExperience}y)</span>
                  <button
                    onClick={() => removeSkill(sk.name)}
                    className="p-0.5 text-slate-400 hover:text-rose-400 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Skill Form */}
            <form onSubmit={handleAddSkill} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-300 mb-1">Add Skill</label>
                <input
                  type="text"
                  required
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="e.g. Docker, GraphQL, Next.js, AWS"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Years Exp</label>
                <input
                  type="number"
                  step="0.5"
                  value={newSkillYears}
                  onChange={(e) => setNewSkillYears(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                className="brand-gradient-btn text-white py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>
          </div>

          {/* Experience Section */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-400" />
                <span>Experience</span>
              </h2>
              <button type="button" onClick={() => setShowExpForm((v) => !v)} className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {experiences.map((exp) => (
              <div key={exp.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-white">{exp.title}</p>
                  <p className="text-slate-300">{exp.companyName}{exp.location ? ` · ${exp.location}` : ''}</p>
                  <p className="text-slate-500 font-mono text-[10px]">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate || 'Present'}</p>
                </div>
                <button onClick={() => removeExperience(exp.id)} className="p-1 text-slate-500 hover:text-rose-400 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}

            {showExpForm && (
              <form onSubmit={handleAddExperience} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input required placeholder="Title (e.g. Senior Engineer)" value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white sm:col-span-2" />
                <input required placeholder="Company name" value={expForm.companyName} onChange={(e) => setExpForm({ ...expForm, companyName: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                <input placeholder="Location" value={expForm.location} onChange={(e) => setExpForm({ ...expForm, location: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                <input required type="date" value={expForm.startDate} onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                <input type="date" disabled={expForm.isCurrent} value={expForm.endDate} onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white disabled:opacity-40" />
                <label className="flex items-center gap-2 text-slate-300 sm:col-span-2">
                  <input type="checkbox" checked={expForm.isCurrent} onChange={(e) => setExpForm({ ...expForm, isCurrent: e.target.checked })} /> I currently work here
                </label>
                <textarea placeholder="Description (optional)" value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white sm:col-span-2" rows={2} />
                <button type="submit" className="brand-gradient-btn text-white py-2 rounded-xl font-bold sm:col-span-2">Save Experience</button>
              </form>
            )}
          </div>

          {/* Education Section */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand-400" />
                <span>Education</span>
              </h2>
              <button type="button" onClick={() => setShowEduForm((v) => !v)} className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {education.map((edu) => (
              <div key={edu.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-white">{edu.schoolName}</p>
                  <p className="text-slate-300">{[edu.degree, edu.fieldOfStudy].filter(Boolean).join(', ')}</p>
                </div>
                <button onClick={() => removeEducation(edu.id)} className="p-1 text-slate-500 hover:text-rose-400 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}

            {showEduForm && (
              <form onSubmit={handleAddEducation} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input required placeholder="School / University" value={eduForm.schoolName} onChange={(e) => setEduForm({ ...eduForm, schoolName: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white sm:col-span-2" />
                <input placeholder="Degree (e.g. B.Tech)" value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                <input placeholder="Field of study" value={eduForm.fieldOfStudy} onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                <input type="date" value={eduForm.startDate} onChange={(e) => setEduForm({ ...eduForm, startDate: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                <input type="date" value={eduForm.endDate} onChange={(e) => setEduForm({ ...eduForm, endDate: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                <button type="submit" className="brand-gradient-btn text-white py-2 rounded-xl font-bold sm:col-span-2">Save Education</button>
              </form>
            )}
          </div>

          {/* Certifications & Projects Section */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 text-xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-400" />
                  <span>Certifications</span>
                </h2>
                <button type="button" onClick={() => setShowCertForm((v) => !v)} className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {certifications.map((cert) => (
                <div key={cert.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{cert.name}</p>
                    {cert.issuingOrg && <p className="text-slate-400 text-[11px]">{cert.issuingOrg}</p>}
                  </div>
                  <button onClick={() => removeCertification(cert.id)} className="p-1 text-slate-500 hover:text-rose-400 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}

              {showCertForm && (
                <form onSubmit={handleAddCertification} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input required placeholder="Certification name" value={certForm.name} onChange={(e) => setCertForm({ ...certForm, name: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white sm:col-span-2" />
                  <input placeholder="Issuing organization" value={certForm.issuingOrg} onChange={(e) => setCertForm({ ...certForm, issuingOrg: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                  <input type="date" value={certForm.issueDate} onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                  <input placeholder="Credential URL (optional)" value={certForm.credentialUrl} onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white sm:col-span-2" />
                  <button type="submit" className="brand-gradient-btn text-white py-2 rounded-xl font-bold sm:col-span-2">Save Certification</button>
                </form>
              )}
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between pb-1 pt-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-brand-400" />
                  <span>Projects</span>
                </h2>
                <button type="button" onClick={() => setShowProjForm((v) => !v)} className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {projects.map((proj) => (
                <div key={proj.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{proj.name}</p>
                    {proj.description && <p className="text-slate-400 text-[11px]">{proj.description}</p>}
                  </div>
                  <button onClick={() => removeProject(proj.id)} className="p-1 text-slate-500 hover:text-rose-400 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}

              {showProjForm && (
                <form onSubmit={handleAddProject} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input required placeholder="Project name" value={projForm.name} onChange={(e) => setProjForm({ ...projForm, name: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white sm:col-span-2" />
                  <input placeholder="Project URL (optional)" value={projForm.url} onChange={(e) => setProjForm({ ...projForm, url: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white sm:col-span-2" />
                  <textarea placeholder="Description" value={projForm.description} onChange={(e) => setProjForm({ ...projForm, description: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white sm:col-span-2" rows={2} />
                  <button type="submit" className="brand-gradient-btn text-white py-2 rounded-xl font-bold sm:col-span-2">Save Project</button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Resume Upload & Supabase Storage */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4 text-xs">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Resume Document</span>
            </h2>

            <p className="text-slate-300 leading-relaxed">
              Upload your latest PDF resume to Supabase Storage bucket (<code className="text-brand-300 font-mono">resumes/</code>) for direct application submissions.
            </p>

            <div className="p-5 rounded-2xl bg-slate-950 border border-dashed border-slate-700 hover:border-brand-500/60 text-center space-y-3 cursor-pointer relative transition-all">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-8 h-8 text-brand-400 mx-auto" />
              <div>
                <span className="font-bold text-white">Click or Drag PDF to Upload</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF up to 10MB</p>
              </div>
            </div>

            {resumeFileName && (
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-white truncate">{resumeFileName}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                  Ready
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

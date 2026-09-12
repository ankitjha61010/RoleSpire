import React, { useState } from 'react';
import { 
  User, 
  Briefcase, 
  MapPin, 
  IndianRupee, 
  Globe, 
  UploadCloud, 
  Plus, 
  X, 
  Check, 
  Save, 
  FileText, 
  Sparkles,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserSkill } from '../types';
import { uploadResumeFile } from '../lib/storage';
import { UserRoleBadge } from '../components/common/UserRoleBadge';
import { UserRole, UserBadgeStatus } from '../types';
import confetti from 'canvas-confetti';

export const ProfilePage: React.FC = () => {
  const { profile, updateProfile, addSkill, removeSkill } = useAuth();

  // Form states
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [role, setRole] = useState<UserRole>(profile?.role || 'job_seeker');
  const [badgeStatus, setBadgeStatus] = useState<UserBadgeStatus>(profile?.badgeStatus || 'open_to_work');
  const [company, setCompany] = useState(profile?.company || '');
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      fullName,
      headline,
      bio,
      role,
      badgeStatus,
      company,
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

              <div>
                <label className="block font-bold text-slate-300 mb-1">Company / Organization (Optional)</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google, Stripe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-500 font-medium"
                />
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

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Globe, 
  Users, 
  Briefcase, 
  Star, 
  Share2, 
  Check, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Plus, 
  UserPlus, 
  Clock, 
  CheckCircle2,
  Calendar,
  MessageCircle,
  Award
} from 'lucide-react';
import { CompanyData } from '../services/mockCompanies';
import { Job, PostAuthor } from '../types';
import { JobCard } from '../components/jobs/JobCard';
import { UserRoleBadge } from '../components/common/UserRoleBadge';
import { useCommunity } from '../context/CommunityContext';
import confetti from 'canvas-confetti';

interface CompanyProfilePageProps {
  company: CompanyData | null;
  allJobs: Job[];
  onBack: () => void;
  onSelectJob: (job: Job) => void;
  onSelectAuthor?: (author: PostAuthor) => void;
}

export const CompanyProfilePage: React.FC<CompanyProfilePageProps> = ({
  company,
  allJobs,
  onBack,
  onSelectJob,
  onSelectAuthor,
}) => {
  const { getConnectionStatus, sendConnectionRequest } = useCommunity();
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'jobs' | 'people' | 'culture'>('home');
  const [isFollowing, setIsFollowing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!company) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-400">Company profile not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors font-medium text-sm inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    );
  }

  const companyJobs = allJobs.filter(
    (j) => j.company.toLowerCase().includes(company.name.toLowerCase()) || 
           company.name.toLowerCase().includes(j.company.toLowerCase())
  );

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    if (!isFollowing) {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 animate-fadeIn pb-24">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-medium shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Search</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-medium"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied' : 'Share Company'}</span>
          </button>
        </div>
      </div>

      {/* Main Company Header Card */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
        {/* Cover Banner */}
        <div className="h-40 sm:h-56 w-full relative overflow-hidden bg-slate-900">
          <img
            src={company.bannerUrl}
            alt={company.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        {/* Company Info Header */}
        <div className="px-5 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-5">
            {/* Logo */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-4 border-slate-900 shadow-2xl flex items-center justify-center overflow-hidden shrink-0">
              <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 sm:pb-1">
              <button
                onClick={handleFollowToggle}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
                  isFollowing
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'brand-gradient-btn text-white hover:scale-102'
                }`}
              >
                {isFollowing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{isFollowing ? 'Following ✓' : 'Follow'}</span>
              </button>

              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-xs transition-all shadow-sm"
              >
                <Globe className="w-3.5 h-3.5 text-brand-400" />
                <span>Website</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Name & Headline */}
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center flex-wrap gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {company.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Employer
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-current" /> {company.rating}
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-300 font-medium">
              {company.tagline}
            </p>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{company.industry}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{company.headquarters}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>{company.followersCount.toLocaleString()} followers</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{companyJobs.length || company.activeJobsCount} Active Jobs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation (LinkedIn Style) */}
        <div className="px-5 sm:px-8 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-2 sm:gap-6 overflow-x-auto scrollbar-none">
          {[
            { id: 'home', label: 'Home' },
            { id: 'about', label: 'About' },
            { id: 'jobs', label: `Jobs (${companyJobs.length || company.activeJobsCount})` },
            { id: 'people', label: `People & Recruiters (${company.employees.length})` },
            { id: 'culture', label: 'Life & Culture' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Home Overview */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* About snippet */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">About {company.name}</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{company.about}</p>
          </div>

          {/* Featured Jobs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-400" />
                <span>Recent Job Openings at {company.name}</span>
              </h3>
              <button
                onClick={() => setActiveTab('jobs')}
                className="text-xs font-semibold text-brand-400 hover:underline"
              >
                View all ({companyJobs.length}) →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companyJobs.slice(0, 4).map((j) => (
                <JobCard key={j.id} job={j} onSelectJob={() => onSelectJob(j)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: About */}
      {activeTab === 'about' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Overview</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{company.about}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <div className="text-slate-400 text-xs font-semibold">Website</div>
              <a href={company.website} target="_blank" rel="noreferrer" className="text-brand-400 hover:underline text-xs font-medium">
                {company.website}
              </a>
            </div>

            <div>
              <div className="text-slate-400 text-xs font-semibold">Industry</div>
              <div className="text-slate-200 text-xs">{company.industry}</div>
            </div>

            <div>
              <div className="text-slate-400 text-xs font-semibold">Company size</div>
              <div className="text-slate-200 text-xs">{company.companySize}</div>
            </div>

            <div>
              <div className="text-slate-400 text-xs font-semibold">Headquarters</div>
              <div className="text-slate-200 text-xs">{company.headquarters}</div>
            </div>

            <div>
              <div className="text-slate-400 text-xs font-semibold">Founded</div>
              <div className="text-slate-200 text-xs">{company.founded}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Specialties & Core Tech</h4>
            <div className="flex flex-wrap gap-2">
              {company.specialties.map((s) => (
                <span key={s} className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-brand-300 text-xs font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Jobs */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              All Openings ({companyJobs.length})
            </h3>
            <span className="text-xs text-slate-400">Direct ATS & Aggregated</span>
          </div>

          {companyJobs.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 border border-slate-800">
              No current openings matched. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companyJobs.map((j) => (
                <JobCard key={j.id} job={j} onSelectJob={() => onSelectJob(j)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: People & Recruiters */}
      {activeTab === 'people' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-400" />
              <span>Employees, Recruiters & Hiring Leads</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {company.employees.map((emp) => {
                const connStatus = getConnectionStatus(emp.id);
                return (
                  <div
                    key={emp.id}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-brand-500/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs overflow-hidden shrink-0">
                        <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                        {emp.isHiring && (
                          <div className="absolute bottom-0 inset-x-0 bg-indigo-600 text-center text-[7px] font-black text-white py-0.2">
                            HIRING
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 
                            onClick={() => {
                              if (onSelectAuthor) {
                                onSelectAuthor({
                                  id: emp.id,
                                  name: emp.name,
                                  avatarUrl: emp.avatar,
                                  headline: emp.headline,
                                  company: company.name,
                                  isRecruiter: emp.isRecruiter,
                                  role: emp.isRecruiter ? 'recruiter' : 'job_seeker',
                                  badgeStatus: emp.isHiring ? 'hiring' : 'open_to_work',
                                });
                              }
                            }}
                            className="font-bold text-white text-xs hover:text-brand-300 transition-colors cursor-pointer truncate"
                          >
                            {emp.name}
                          </h4>
                          <UserRoleBadge
                            role={emp.isRecruiter ? 'recruiter' : 'job_seeker'}
                            badgeStatus={emp.isHiring ? 'hiring' : 'none'}
                            size="xs"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{emp.role}</p>
                        <p className="text-[10px] text-slate-500 truncate">{emp.headline}</p>
                      </div>
                    </div>

                    {/* Connect & Message Action */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                      {connStatus === 'accepted' ? (
                        <span className="flex-1 py-1 text-center rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Connected
                        </span>
                      ) : connStatus === 'pending' ? (
                        <span className="flex-1 py-1 text-center rounded-lg bg-amber-500/10 text-amber-400 text-[10px] font-semibold animate-pulse flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3" /> Pending...
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            sendConnectionRequest({
                              id: emp.id,
                              name: emp.name,
                              avatarUrl: emp.avatar,
                              headline: emp.headline,
                              company: company.name,
                              isRecruiter: emp.isRecruiter,
                              role: emp.isRecruiter ? 'recruiter' : 'job_seeker',
                              badgeStatus: emp.isHiring ? 'hiring' : 'open_to_work',
                            });
                            confetti({ particleCount: 20, spread: 40 });
                          }}
                          className="flex-1 py-1 rounded-lg brand-gradient-btn text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Connect</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (onSelectAuthor) {
                            onSelectAuthor({
                              id: emp.id,
                              name: emp.name,
                              avatarUrl: emp.avatar,
                              headline: emp.headline,
                              company: company.name,
                              isRecruiter: emp.isRecruiter,
                              role: emp.isRecruiter ? 'recruiter' : 'job_seeker',
                              badgeStatus: emp.isHiring ? 'hiring' : 'open_to_work',
                            });
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-medium"
                      >
                        Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Life & Culture */}
      {activeTab === 'culture' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>Work Culture & Engineering Principles</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {company.cultureHighlights.map((cul, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-2xl">{cul.icon}</span>
                <h4 className="font-bold text-white text-xs sm:text-sm">{cul.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{cul.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

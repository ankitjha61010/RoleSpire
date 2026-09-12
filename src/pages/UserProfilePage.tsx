import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  MessageCircle,
  UserPlus,
  Clock,
  Check,
  Sparkles,
  Share2,
  CheckCircle2,
  Heart,
  MessageSquare,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  FolderGit2,
  Loader2,
} from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { useChat } from '../context/ChatContext';
import { UserRoleBadge } from '../components/common/UserRoleBadge';
import { fetchPublicProfile, PublicProfile } from '../services/publicProfile';
import confetti from 'canvas-confetti';

interface UserProfilePageProps {
  userId: string | null;
  onBack: () => void;
  onSelectCompanyId?: (companyId: string) => void;
}

function formatDateRange(start?: string, end?: string, isCurrent?: boolean) {
  const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '');
  if (!start) return '';
  return `${fmt(start)} – ${isCurrent ? 'Present' : fmt(end) || 'Present'}`;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ userId, onBack, onSelectCompanyId }) => {
  const { getConnectionStatus, sendConnectionRequest, posts, toggleLikePost } = useCommunity();
  const { startChatWithUser } = useChat();

  const [author, setAuthor] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setAuthor(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetchPublicProfile(userId).then((result) => {
      if (!cancelled) {
        setAuthor(result);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin mx-auto" />
      </div>
    );
  }

  if (!author) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-400">User profile not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors font-medium text-sm inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    );
  }

  const connectionStatus = getConnectionStatus(author.id);

  const handleConnect = () => {
    if (connectionStatus === 'none') {
      sendConnectionRequest(author);
      confetti({ particleCount: 25, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleStartMessage = () => {
    startChatWithUser({
      id: author.id,
      name: author.name,
      avatarUrl: author.avatarUrl,
      headline: author.headline,
      company: author.company || 'Tech Leader',
      isOnline: false,
    });
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const authorPosts = posts.filter((p) => p.author.id === author.id);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 animate-fadeIn pb-24">
      {/* Top Breadcrumb / Back Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-medium shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-medium"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Profile'}</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Banner Card */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
        <div className="h-36 sm:h-48 w-full bg-gradient-to-r from-brand-600/30 via-purple-600/25 to-blue-600/30 relative overflow-hidden">
          {author.avatarUrl === undefined && (
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          )}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-5">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border-4 border-slate-900 flex items-center justify-center text-white text-3xl font-extrabold shadow-2xl overflow-hidden ring-2 ring-brand-500/40 shrink-0">
              {author.avatarUrl ? (
                <img src={author.avatarUrl} alt={author.name} className="w-full h-full object-cover" />
              ) : (
                <span>{author.name.charAt(0)}</span>
              )}

              {author.badgeStatus && author.badgeStatus !== 'none' && (
                <div className={`absolute bottom-0 inset-x-0 py-0.5 text-center text-[9px] font-black uppercase tracking-wider text-white shadow-md ${
                  author.badgeStatus === 'hiring' ? 'bg-indigo-600/90' :
                  author.badgeStatus === 'open_to_refer' ? 'bg-cyan-600/90' : 'bg-emerald-600/90'
                }`}>
                  {author.badgeStatus === 'hiring' ? 'HIRING' : author.badgeStatus === 'open_to_refer' ? 'REFER' : 'OPEN TO WORK'}
                </div>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-2.5 sm:pb-1">
              {connectionStatus === 'accepted' ? (
                <button disabled className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs shadow-sm cursor-default">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Connected</span>
                </button>
              ) : connectionStatus === 'pending' ? (
                <button disabled className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs shadow-sm animate-pulse cursor-wait">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Request Sent (Pending...)</span>
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl brand-gradient-btn text-white font-bold text-xs shadow-lg hover:shadow-brand-500/25 transition-all active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Connect</span>
                </button>
              )}

              <button
                onClick={handleStartMessage}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-xs transition-all shadow-sm active:scale-95"
              >
                <MessageCircle className="w-4 h-4 text-brand-400" />
                <span>Message</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center flex-wrap gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{author.name}</h1>
              <UserRoleBadge role={author.role} badgeStatus={author.badgeStatus} size="md" />
            </div>

            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">{author.headline}</p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              {author.company && (
                author.companyId && onSelectCompanyId ? (
                  <button
                    onClick={() => onSelectCompanyId(author.companyId!)}
                    className="flex items-center gap-1.5 text-slate-300 hover:text-brand-400 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-brand-400" />
                    <span className="font-semibold underline decoration-dotted">{author.company}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Building2 className="w-4 h-4 text-brand-400" />
                    <span className="font-semibold">{author.company}</span>
                  </div>
                )
              )}
              {author.currentLocation && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>{author.currentLocation}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-8 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-2 sm:gap-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'overview' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'activity' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Activity & Posts ({authorPosts.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {author.bio && (
              <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  <span>About</span>
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{author.bio}</p>
              </div>
            )}

            {author.experiences.length > 0 && (
              <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-brand-400" />
                  <span>Experience</span>
                </h3>
                <div className="space-y-4">
                  {author.experiences.map((exp) => (
                    <div key={exp.id} className="text-sm">
                      <p className="font-bold text-white">{exp.title}</p>
                      <p className="text-slate-300">{exp.companyName}{exp.location ? ` · ${exp.location}` : ''}</p>
                      <p className="text-xs text-slate-500 font-mono">{formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}</p>
                      {exp.description && <p className="text-xs text-slate-400 mt-1 whitespace-pre-line">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {author.education.length > 0 && (
              <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-brand-400" />
                  <span>Education</span>
                </h3>
                <div className="space-y-4">
                  {author.education.map((edu) => (
                    <div key={edu.id} className="text-sm">
                      <p className="font-bold text-white">{edu.schoolName}</p>
                      <p className="text-slate-300">{[edu.degree, edu.fieldOfStudy].filter(Boolean).join(', ')}</p>
                      <p className="text-xs text-slate-500 font-mono">{formatDateRange(edu.startDate, edu.endDate)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(author.certifications.length > 0 || author.projects.length > 0) && (
              <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                {author.certifications.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-brand-400" />
                      <span>Certifications</span>
                    </h3>
                    {author.certifications.map((cert) => (
                      <div key={cert.id} className="text-sm">
                        <p className="font-bold text-white">{cert.name}</p>
                        {cert.issuingOrg && <p className="text-slate-400 text-xs">{cert.issuingOrg}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {author.projects.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-brand-400" />
                      <span>Projects</span>
                    </h3>
                    {author.projects.map((proj) => (
                      <div key={proj.id} className="text-sm">
                        <p className="font-bold text-white">
                          {proj.url ? <a href={proj.url} target="_blank" rel="noreferrer" className="hover:text-brand-400">{proj.name}</a> : proj.name}
                        </p>
                        {proj.description && <p className="text-slate-400 text-xs">{proj.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {author.skills.length > 0 && (
              <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {author.skills.map((s) => (
                    <span key={s.name} className="text-[11px] px-2 py-1 rounded-md bg-slate-900 text-brand-300 border border-slate-800 font-medium">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Connection Status</h3>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Status:</span>
                  <span className={`font-bold capitalize ${
                    connectionStatus === 'accepted' ? 'text-emerald-400' :
                    connectionStatus === 'pending' ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {connectionStatus === 'none' ? 'Not Connected' : connectionStatus}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {connectionStatus === 'accepted'
                    ? 'You can now exchange direct messages and referral requests.'
                    : connectionStatus === 'pending'
                    ? 'Connection request is pending acceptance.'
                    : 'Connect with this member to collaborate, ask for referrals, or chat directly.'}
                </p>
              </div>

              {connectionStatus === 'none' && (
                <button
                  onClick={handleConnect}
                  className="w-full py-2.5 rounded-xl brand-gradient-btn text-white text-xs font-bold shadow-md hover:shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Send Connection Request</span>
                </button>
              )}

              <button
                onClick={handleStartMessage}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-3.5 h-3.5 text-brand-400" />
                <span>Start Direct Message</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-400" />
              <span>Community Posts by {author.name}</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{authorPosts.length} posts</span>
          </div>

          {authorPosts.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 space-y-2 border border-slate-800">
              <FileText className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">No posts yet from this user.</p>
            </div>
          ) : (
            authorPosts.map((post) => (
              <div key={post.id} className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3 hover:border-brand-500/30 transition-all text-xs shadow-md">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-brand-500/15 text-brand-300 font-semibold uppercase tracking-wider text-[10px]">
                    {post.category}
                  </span>
                  <span className="font-mono text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-white">{post.title}</h4>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line text-xs">{post.content}</p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {post.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-brand-300 border border-slate-800 font-mono">
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <button
                    onClick={() => toggleLikePost(post.id)}
                    className={`flex items-center gap-1.5 transition-colors font-semibold ${post.isLiked ? 'text-rose-400' : 'text-slate-400 hover:text-rose-400'}`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span>{post.likesCount}</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{post.commentsCount} comments</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

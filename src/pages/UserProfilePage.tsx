import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
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
} from 'lucide-react';
import { PostAuthor, CommunityPost } from '../types';
import { useCommunity } from '../context/CommunityContext';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { UserRoleBadge } from '../components/common/UserRoleBadge';
import confetti from 'canvas-confetti';

interface UserProfilePageProps {
  author: PostAuthor | null;
  onBack: () => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ author, onBack }) => {
  const { getConnectionStatus, sendConnectionRequest, posts, toggleLikePost, addComment } = useCommunity();
  const { startChatWithUser } = useChat();
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  if (!author) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-400">User profile not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors font-medium text-sm inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Community
        </button>
      </div>
    );
  }

  const connectionStatus = getConnectionStatus(author.id);

  const handleConnect = () => {
    if (connectionStatus === 'none') {
      sendConnectionRequest(author);
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.7 }
      });
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

  const userBio = `${author.headline}${author.company ? ` at ${author.company}` : ''}.`;

  const authorPosts = posts.filter(p => p.author.id === author.id);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 animate-fadeIn pb-24">
      {/* Top Breadcrumb / Back Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-medium shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Community</span>
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
        {/* Cover Gradient Banner */}
        <div className="h-36 sm:h-48 w-full bg-gradient-to-r from-brand-600/30 via-purple-600/25 to-blue-600/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        {/* Profile Details Container */}
        <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
          {/* Avatar & Action Button Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-5">
            {/* Avatar */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border-4 border-slate-900 flex items-center justify-center text-white text-3xl font-extrabold shadow-2xl overflow-hidden ring-2 ring-brand-500/40 shrink-0">
              {author.avatarUrl ? (
                <img src={author.avatarUrl} alt={author.name} className="w-full h-full object-cover" />
              ) : (
                <span>{author.name.charAt(0)}</span>
              )}

              {/* Status Ribbon on Avatar Bottom */}
              {author.badgeStatus && author.badgeStatus !== 'none' && (
                <div className={`absolute bottom-0 inset-x-0 py-0.5 text-center text-[9px] font-black uppercase tracking-wider text-white shadow-md ${
                  author.badgeStatus === 'hiring' ? 'bg-indigo-600/90' :
                  author.badgeStatus === 'open_to_refer' ? 'bg-cyan-600/90' : 'bg-emerald-600/90'
                }`}>
                  {author.badgeStatus === 'hiring' ? 'HIRING' : author.badgeStatus === 'open_to_refer' ? 'REFER' : 'OPEN TO WORK'}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center flex-wrap gap-2.5 sm:pb-1">
              {/* Connection Action Button with WebSocket Pending State */}
              {connectionStatus === 'accepted' ? (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs shadow-sm cursor-default"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Connected</span>
                </button>
              ) : connectionStatus === 'pending' ? (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs shadow-sm animate-pulse cursor-wait"
                >
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

              {/* Direct Message Button */}
              <button
                onClick={handleStartMessage}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-xs transition-all shadow-sm active:scale-95"
              >
                <MessageCircle className="w-4 h-4 text-brand-400" />
                <span>Message</span>
              </button>
            </div>
          </div>

          {/* User Name, Badges & Headline */}
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center flex-wrap gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {author.name}
              </h1>
              <UserRoleBadge 
                role={author.role} 
                badgeStatus={author.badgeStatus} 
                isRecruiter={author.isRecruiter}
                size="md"
              />
            </div>

            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              {author.headline}
            </p>

            {/* Quick Metadata Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              {author.company && (
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Building2 className="w-4 h-4 text-brand-400" />
                  <span className="font-semibold">{author.company}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 sm:px-8 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-2 sm:gap-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Overview & Bio</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Activity & Posts ({authorPosts.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2 Cols: About & Highlights */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>About</span>
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {userBio}
              </p>
            </div>
          </div>

          {/* Right Col: Quick Connect Card & Info */}
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Connection Status
              </h3>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Realtime Status:</span>
                  <span className={`font-bold capitalize ${
                    connectionStatus === 'accepted' ? 'text-emerald-400' :
                    connectionStatus === 'pending' ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {connectionStatus === 'none' ? 'Not Connected' : connectionStatus}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {connectionStatus === 'accepted' 
                    ? 'You can now exchange direct direct messages and referral requests in real-time.' 
                    : connectionStatus === 'pending'
                    ? 'Connection request is pending acceptance by receiver via WebSocket channel.'
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

      {/* Tab Content: Activity & Posts */}
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
              <div
                key={post.id}
                className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3 hover:border-brand-500/30 transition-all text-xs shadow-md"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-brand-500/15 text-brand-300 font-semibold uppercase tracking-wider text-[10px]">
                    {post.category}
                  </span>
                  <span className="font-mono text-slate-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-white">
                  {post.title}
                </h4>

                <p className="text-slate-300 leading-relaxed whitespace-pre-line text-xs">
                  {post.content}
                </p>

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
                    className={`flex items-center gap-1.5 transition-colors font-semibold ${
                      post.isLiked ? 'text-rose-400' : 'text-slate-400 hover:text-rose-400'
                    }`}
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

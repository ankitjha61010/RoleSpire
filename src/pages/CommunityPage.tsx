import React, { useEffect, useMemo, useState } from 'react';
import { 
  Users, 
  Plus, 
  MessageSquare, 
  Heart, 
  Share2, 
  Send, 
  Sparkles, 
  Building2, 
  Briefcase, 
  Lightbulb, 
  IndianRupee, 
  DollarSign, 
  Tag, 
  X,
  MessageCircle,
  Clock, 
  CheckCircle2, 
  UserPlus 
} from 'lucide-react';
import { CommunityPost, PostCategory, PostAuthor } from '../types';
import { useCommunity } from '../context/CommunityContext';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { NavPage } from '../components/layout/Navbar';
import { UserRoleBadge } from '../components/common/UserRoleBadge';
import { ScrollablePaginatedList } from '../components/common/ScrollablePaginatedList';
import confetti from 'canvas-confetti';

const POSTS_PAGE_SIZE = 10;

interface CommunityPageProps {
  setActivePage: (page: NavPage) => void;
  onSelectAuthor?: (author: PostAuthor) => void;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({ setActivePage, onSelectAuthor }) => {
  const { posts, createPost, toggleLikePost, addComment, getConnectionStatus, sendConnectionRequest } = useCommunity();
  const { startChatWithUser } = useChat();
  const { profile } = useAuth();

  const [activeCategory, setActiveCategory] = useState<PostCategory | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Post State
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<PostCategory>('referral');
  const [postTags, setPostTags] = useState('React, Hiring, Referral');
  const [postCompany, setPostCompany] = useState('');

  // Comment input per post
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({ post_1: true });

  const [postsPage, setPostsPage] = useState(1);

  const filteredPosts = posts.filter((p) =>
    activeCategory === 'all' ? true : p.category === activeCategory
  );

  useEffect(() => {
    setPostsPage(1);
  }, [activeCategory]);

  const totalPostsPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PAGE_SIZE));
  const pagedPosts = useMemo(
    () => filteredPosts.slice((postsPage - 1) * POSTS_PAGE_SIZE, postsPage * POSTS_PAGE_SIZE),
    [filteredPosts, postsPage]
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    createPost({
      title: postTitle.trim(),
      content: postContent.trim(),
      category: postCategory,
      tags: postTags.split(',').map((t) => t.trim()).filter(Boolean),
      companyTarget: postCompany.trim() || undefined,
    });

    setPostTitle('');
    setPostContent('');
    setPostCompany('');
    setShowCreateModal(false);
    confetti({ particleCount: 35, spread: 50 });
  };

  const handleSendComment = (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    addComment(postId, text.trim());
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
  };

  const handleDirectMessage = (post: CommunityPost) => {
    startChatWithUser(
      {
        id: post.author.id,
        name: post.author.name,
        avatarUrl: post.author.avatarUrl,
        headline: post.author.headline,
        company: post.author.company || 'Tech Member',
        isOnline: false,
        role: post.author.role,
        badgeStatus: post.author.badgeStatus,
      },
      `Hi ${post.author.name.split(' ')[0]}! I saw your post regarding "${post.title.slice(0, 40)}..." on RoleSpire Community.`
    );
    setActivePage('messages');
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            <h1 className="text-base sm:text-lg font-bold text-white">
              Tech Community & Referral Network
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Share job referrals, ask interview questions, discuss compensation, and connect directly with hiring leads.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="brand-gradient-btn text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Post</span>
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'All Posts' },
          { id: 'referral', label: '⚡ Employee Referrals' },
          { id: 'hiring', label: '🚀 Active Hiring' },
          { id: 'interview_tips', label: '💡 Interview Tips' },
          { id: 'salary_insight', label: '💰 Salary Insights' },
          { id: 'general', label: '💬 General Discussions' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              activeCategory === tab.id
                ? 'brand-gradient-btn text-white shadow-sm font-bold'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed Posts */}
      {filteredPosts.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 border border-slate-800 text-xs">
          No posts in this category yet — be the first to share something.
        </div>
      ) : (
      <ScrollablePaginatedList currentPage={postsPage} totalPages={totalPostsPages} onPageChange={setPostsPage}>
        {pagedPosts.map((post) => (
          <div
            key={post.id}
            className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3.5 hover:border-brand-500/30 transition-all text-xs shadow-md"
          >
            {/* Author Header */}
            <div className="flex items-start justify-between gap-3">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => {
                  if (onSelectAuthor) {
                    onSelectAuthor(post.author);
                  }
                }}
              >
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden shadow-sm group-hover:ring-2 group-hover:ring-brand-500/50 transition-all">
                  {post.author.avatarUrl ? (
                    <img src={post.author.avatarUrl} alt={post.author.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{post.author.name.charAt(0)}</span>
                  )}
                  {post.author.badgeStatus === 'hiring' && (
                    <div className="absolute bottom-0 inset-x-0 bg-indigo-600 text-center text-[7px] font-black text-white leading-tight">
                      HIRING
                    </div>
                  )}
                  {post.author.badgeStatus === 'open_to_work' && (
                    <div className="absolute bottom-0 inset-x-0 bg-emerald-600 text-center text-[7px] font-black text-white leading-tight">
                      OPEN
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="font-bold text-white text-xs sm:text-sm group-hover:text-brand-300 transition-colors">
                      {post.author.name}
                    </span>
                    <UserRoleBadge 
                      role={post.author.role} 
                      badgeStatus={post.author.badgeStatus} 
                      isRecruiter={post.author.isRecruiter}
                      size="xs"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {post.author.headline} • <span className="font-mono text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Connect (Pending/Accepted) & View Profile */}
              <div className="flex items-center gap-1.5 shrink-0">
                {(() => {
                  const connStatus = getConnectionStatus(post.author.id);
                  if (connStatus === 'accepted') {
                    return (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    );
                  }
                  if (connStatus === 'pending') {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold animate-pulse">
                        <Clock className="w-3 h-3" /> Pending...
                      </span>
                    );
                  }
                  return (
                    <button
                      onClick={() => {
                        sendConnectionRequest(post.author);
                        confetti({ particleCount: 20, spread: 50, origin: { y: 0.7 } });
                      }}
                      className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-300 text-[11px] font-semibold transition-all"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Connect</span>
                    </button>
                  );
                })()}

                <button
                  onClick={() => {
                    if (onSelectAuthor) {
                      onSelectAuthor(post.author);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-medium transition-all"
                >
                  View Profile
                </button>

                <button
                  onClick={() => handleDirectMessage(post)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg brand-gradient-btn text-white text-[11px] font-semibold transition-all shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Message</span>
                </button>
              </div>
            </div>

            {/* Post Title & Content */}
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-snug mb-1.5">
                {post.title}
              </h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line text-xs">
                {post.content}
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-brand-300 border border-slate-800 font-mono"
                >
                  #{tag}
                </span>
              ))}
              {post.companyTarget && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                  🏢 {post.companyTarget}
                </span>
              )}
            </div>

            {/* Post Engagement Bar */}
            <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleLikePost(post.id)}
                  className={`flex items-center gap-1.5 transition-colors font-semibold ${
                    post.isLiked ? 'text-rose-400' : 'text-slate-400 hover:text-rose-400'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${post.isLiked ? 'fill-current' : ''}`} />
                  <span>{post.likesCount}</span>
                </button>

                <button
                  onClick={() =>
                    setExpandedComments((prev) => ({
                      ...prev,
                      [post.id]: !prev[post.id],
                    }))
                  }
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors font-semibold"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{post.commentsCount || 0} Comments</span>
                </button>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Post link copied to clipboard!');
                }}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>

            {/* Comments Section Accordion */}
            {expandedComments[post.id] && (
              <div className="pt-2 border-t border-slate-800/60 space-y-2.5 bg-slate-950/40 -mx-4 -mb-4 p-4 rounded-b-2xl">
                {/* Existing comments */}
                {(post.comments || []).map((comm) => (
                  <div key={comm.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => {
                          if (onSelectAuthor) {
                            onSelectAuthor(comm.author);
                          }
                        }}
                        className="font-bold text-white hover:text-brand-300 transition-colors text-left"
                      >
                        {comm.author.name}
                      </button>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(comm.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs">{comm.content}</p>
                  </div>
                ))}

                {/* Comment composer */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({
                        ...prev,
                        [post.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendComment(post.id);
                    }}
                    placeholder="Write a comment or reply..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                  <button
                    onClick={() => handleSendComment(post.id)}
                    className="p-2 rounded-xl brand-gradient-btn text-white text-xs font-bold shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </ScrollablePaginatedList>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg glass-dropdown rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-700 text-xs">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-base font-bold text-white mb-3">Create Community Post</h2>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Post Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { id: 'referral', label: '⚡ Referral' },
                    { id: 'hiring', label: '🚀 Hiring' },
                    { id: 'interview_tips', label: '💡 Interview Tips' },
                    { id: 'salary_insight', label: '💰 Salary' },
                    { id: 'general', label: '💬 Discussion' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setPostCategory(cat.id as PostCategory)}
                      className={`p-1.5 rounded-lg text-center font-semibold transition-all ${
                        postCategory === cat.id
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Hiring Senior React Native Leads"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Target Company (Optional)</label>
                <input
                  type="text"
                  value={postCompany}
                  onChange={(e) => setPostCompany(e.target.value)}
                  placeholder="e.g. Google, Stripe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Content / Details *</label>
                <textarea
                  required
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={4}
                  placeholder="Share details, required tech stack, compensation range, or interview guidance..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Tags (Comma Separated)</label>
                <input
                  type="text"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  placeholder="React Native, Hiring, Remote"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                className="w-full brand-gradient-btn text-white py-2.5 rounded-xl font-bold text-xs shadow-md mt-2"
              >
                Publish Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

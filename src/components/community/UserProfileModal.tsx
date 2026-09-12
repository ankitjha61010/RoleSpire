import React, { useState } from 'react';
import {
  X,
  Briefcase,
  MapPin,
  MessageSquare,
  UserPlus,
  Check,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { PostAuthor } from '../../types';

interface UserProfileModalProps {
  user: PostAuthor | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (user: PostAuthor) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onStartChat,
}) => {
  const [isConnected, setIsConnected] = useState(false);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-700/80 bg-slate-900/95 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cover Background Banner */}
        <div className="h-28 -mx-6 sm:-mx-7 -mt-6 sm:-mt-7 rounded-t-3xl brand-gradient-btn opacity-85 relative overflow-hidden flex items-end p-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Profile Header */}
        <div className="relative -mt-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-4">
          <div className="flex items-end gap-3.5">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 border-4 border-slate-900 overflow-hidden shadow-xl shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-extrabold text-2xl brand-gradient-btn">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">{user.name}</h2>
                {user.isRecruiter ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                    Recruiter
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/40 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Member
                  </span>
                )}
              </div>
              <p className="text-xs text-brand-300 font-semibold">{user.headline}</p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3" /> {user.company || 'Tech Leader'} • <MapPin className="w-3 h-3 ml-1" /> India / Global
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 my-4">
          <button
            onClick={() => {
              onStartChat(user);
              onClose();
            }}
            className="flex-1 brand-gradient-btn text-white py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md hover:scale-102 active:scale-98 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Send Direct Message</span>
          </button>

          <button
            onClick={() => setIsConnected(!isConnected)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              isConnected
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isConnected ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Connect</span>
              </>
            )}
          </button>
        </div>

        {/* About */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 mb-4 text-xs">
          <div className="font-bold text-white mb-1">About</div>
          <p className="text-slate-300 leading-relaxed text-[11px] flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-brand-400 shrink-0" />
            <span>{user.headline}{user.company ? ` at ${user.company}` : ''}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

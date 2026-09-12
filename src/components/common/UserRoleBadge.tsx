import React from 'react';
import { ShieldCheck, Briefcase, Sparkles, HeartHandshake, User, Flame } from 'lucide-react';
import { UserRole, UserBadgeStatus } from '../../types';

interface UserRoleBadgeProps {
  role?: UserRole | string;
  badgeStatus?: UserBadgeStatus | string;
  isRecruiter?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showBoth?: boolean;
}

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({
  role,
  badgeStatus,
  isRecruiter,
  size = 'sm',
  showBoth = true,
}) => {
  const effectiveRole: UserRole = isRecruiter ? 'recruiter' : (role as UserRole) || 'job_seeker';
  const effectiveBadge: UserBadgeStatus = (badgeStatus as UserBadgeStatus) || (isRecruiter ? 'hiring' : 'open_to_work');

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.2 gap-0.5',
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  // Role Badge Config
  const roleConfig = {
    recruiter: {
      label: 'Recruiter / Talent Lead',
      shortLabel: 'Recruiter',
      classes: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      icon: ShieldCheck,
    },
    founder: {
      label: 'Founder / Hiring Manager',
      shortLabel: 'Founder',
      classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      icon: Flame,
    },
    mentor: {
      label: 'Tech Mentor',
      shortLabel: 'Mentor',
      classes: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      icon: HeartHandshake,
    },
    job_seeker: {
      label: 'Software Engineer / Candidate',
      shortLabel: 'Candidate',
      classes: 'bg-slate-800/80 text-slate-300 border-slate-700',
      icon: User,
    },
  }[effectiveRole] || {
    label: 'Member',
    shortLabel: 'Member',
    classes: 'bg-slate-800 text-slate-300 border-slate-700',
    icon: User,
  };

  // Status Badge Config (Open to Work, Hiring, etc.)
  const statusConfig = {
    open_to_work: {
      label: '#OPEN TO WORK',
      shortLabel: 'Open to Work',
      classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 ring-1 ring-emerald-500/20 shadow-emerald-950/40 shadow-sm font-extrabold',
      icon: Sparkles,
    },
    hiring: {
      label: '#HIRING',
      shortLabel: 'Hiring',
      classes: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40 ring-1 ring-indigo-500/30 shadow-indigo-950/40 shadow-sm font-extrabold animate-pulse',
      icon: Briefcase,
    },
    open_to_refer: {
      label: '#OPEN TO REFER',
      shortLabel: 'Open to Refer',
      classes: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 ring-1 ring-cyan-500/20 font-bold',
      icon: HeartHandshake,
    },
    casually_looking: {
      label: '#CASUALLY EXPLORING',
      shortLabel: 'Exploring',
      classes: 'bg-slate-800/80 text-slate-300 border-slate-700 font-medium',
      icon: User,
    },
    none: null,
  }[effectiveBadge];

  const RoleIcon = roleConfig.icon;
  const StatusIcon = statusConfig?.icon;

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      {/* Role Badge (Recruiter / Founder / Job Seeker) */}
      {effectiveRole !== 'job_seeker' && (
        <span
          className={`inline-flex items-center rounded-full font-semibold border ${roleConfig.classes} ${sizeClasses}`}
        >
          <RoleIcon className={iconSizes} />
          <span>{size === 'xs' ? roleConfig.shortLabel : roleConfig.label}</span>
        </span>
      )}

      {/* Status Photo Badge Frame or Tag (#OpenToWork / #Hiring) */}
      {statusConfig && showBoth && (
        <span
          className={`inline-flex items-center rounded-full border ${statusConfig.classes} ${sizeClasses}`}
        >
          {StatusIcon && <StatusIcon className={iconSizes} />}
          <span>{size === 'xs' ? statusConfig.shortLabel : statusConfig.label}</span>
        </span>
      )}
    </div>
  );
};

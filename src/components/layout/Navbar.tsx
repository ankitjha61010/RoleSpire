import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase,
  Sparkles,
  Layers,
  Bookmark,
  GitCompare,
  BarChart3,
  User,
  Bell,
  Database,
  Search,
  CheckCircle2,
  Calendar,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApplications } from '../../context/ApplicationContext';
import { ThemePicker } from './ThemePicker';
import { SupabaseModal } from './SupabaseModal';
import { AuthModal } from './AuthModal';
import { UserRoleBadge } from '../common/UserRoleBadge';
import { LogIn } from 'lucide-react';

export type NavPage =
  | 'home'
  | 'search'
  | 'foryou'
  | 'community'
  | 'messages'
  | 'applications'
  | 'saved'
  | 'compare'
  | 'analytics'
  | 'alerts'
  | 'profile'
  | 'user-profile'
  | 'company-profile';

interface NavbarProps {
  activePage: NavPage;
  setActivePage: (page: NavPage) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, setActivePage }) => {
  const { profile, signOut, signInDemoUser, isSupabaseLive } = useAuth();
  const { reminders } = useApplications();

  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const navContainerRef = useRef<HTMLDivElement>(null);

  const overdueCount = reminders.filter((r) => r.isOverdue).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navContainerRef.current && !navContainerRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
        setShowThemePicker(false);
        setShowProfileMenu(false);
        setShowMoreMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary visible links in navbar
  const primaryNavItems: { id: NavPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Dashboard', icon: Briefcase },
    { id: 'search', label: 'Find Jobs', icon: Search },
    { id: 'foryou', label: 'For You', icon: Sparkles },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'applications', label: 'Applications', icon: Layers },
    { id: 'saved', label: 'Saved', icon: Bookmark },
  ];

  const handleNavClick = (page: NavPage) => {
    setActivePage(page);
    setShowMobileMenu(false);
    setShowMoreMenu(false);
  };

  return (
    <>
      <header ref={navContainerRef} className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 transition-all bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Left: Brand Logo */}
            <div className="flex items-center gap-4 lg:gap-6">
              <button
                onClick={() => handleNavClick('home')}
                className="flex items-center gap-2 group text-left focus:outline-none shrink-0"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl brand-gradient-btn flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                    Role<span className="text-brand-400">Spire</span>
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 font-mono tracking-wider">
                    INTEL
                  </span>
                </div>
              </button>

              {/* Desktop Nav Links */}
              <nav className="hidden lg:flex items-center gap-1">
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${isActive
                          ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 font-semibold shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-850'
                        }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                {/* More dropdown for Compare & Analytics */}
                <div className="relative">
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${activePage === 'compare' || activePage === 'analytics'
                        ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-850'
                      }`}
                  >
                    <span>More</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showMoreMenu && (
                    <div className="absolute left-0 mt-2 w-44 glass-dropdown rounded-2xl p-1.5 shadow-2xl z-50 border border-slate-700/80 text-xs animate-in fade-in slide-in-from-top-2">
                      <button
                        onClick={() => handleNavClick('compare')}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-left font-medium"
                      >
                        <GitCompare className="w-3.5 h-3.5 text-brand-400" />
                        <span>Compare Matrix</span>
                      </button>
                      <button
                        onClick={() => handleNavClick('analytics')}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-left font-medium"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Search Analytics</span>
                      </button>
                    </div>
                  )}
                </div>
              </nav>
            </div>

            {/* Right: Status & Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowThemePicker(false);
                    setShowProfileMenu(false);
                  }}
                  onMouseEnter={() => {
                    if (showThemePicker || showProfileMenu) {
                      setShowNotifications(true);
                      setShowThemePicker(false);
                      setShowProfileMenu(false);
                    }
                  }}
                  className={`relative p-2 rounded-xl transition-all border ${
                    showNotifications
                      ? 'bg-slate-800 text-white border-brand-500/50 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'
                  }`}
                  title="Follow-up Reminders"
                >
                  <Bell className="w-4 h-4 text-slate-300" />
                  {reminders.length > 0 && (
                    <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${overdueCount > 0 ? 'bg-rose-500 animate-bounce' : 'bg-brand-500'
                      }`}>
                      {reminders.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full mt-0 sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm glass-dropdown rounded-2xl p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 border border-slate-700/80 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <Calendar className="w-3.5 h-3.5 text-brand-400" />
                        <span>Follow-up Reminders</span>
                      </div>
                      <span className="text-[10px] bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded font-mono">
                        {reminders.length}
                      </span>
                    </div>

                    <div className="mt-2.5 max-h-56 overflow-y-auto space-y-1.5">
                      {reminders.length === 0 ? (
                        <div className="text-center py-4 text-slate-400 text-[11px]">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1 opacity-80" />
                          No pending follow-ups!
                        </div>
                      ) : (
                        reminders.map((rem) => (
                          <div
                            key={rem.applicationId}
                            onClick={() => {
                              handleNavClick('applications');
                              setShowNotifications(false);
                            }}
                            className={`p-2 rounded-lg border cursor-pointer transition-all ${rem.isOverdue
                                ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-brand-500/40'
                              }`}
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span className="text-white truncate max-w-[140px]">{rem.companyName}</span>
                              <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${rem.isOverdue ? 'bg-rose-500/30 text-rose-300' : 'bg-brand-500/20 text-brand-300'
                                }`}>
                                {rem.isOverdue ? 'Overdue' : `${rem.daysRemaining}d`}
                              </span>
                            </div>
                            <div className="text-slate-400 text-[10px] truncate">
                              {rem.jobTitle}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      onClick={() => {
                        handleNavClick('applications');
                        setShowNotifications(false);
                      }}
                      className="w-full mt-2 py-1.5 text-center text-[11px] font-semibold text-brand-300 hover:text-brand-200 bg-brand-500/10 hover:bg-brand-500/20 rounded-lg transition-all"
                    >
                      Open Application Tracker →
                    </button>
                  </div>
                )}
              </div>

              {/* Theme Picker */}
              <ThemePicker 
                isOpen={showThemePicker}
                onToggle={(open) => {
                  setShowThemePicker(open);
                  if (open) {
                    setShowNotifications(false);
                    setShowProfileMenu(false);
                  }
                }}
              />

              {/* Profile Avatar / Menu OR Sign In Button */}
              {profile ? (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowProfileMenu(!showProfileMenu);
                      setShowNotifications(false);
                      setShowThemePicker(false);
                    }}
                    onMouseEnter={() => {
                      if (showNotifications || showThemePicker) {
                        setShowProfileMenu(true);
                        setShowNotifications(false);
                        setShowThemePicker(false);
                      }
                    }}
                    className={`flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all text-left ${
                      showProfileMenu
                        ? 'bg-slate-800 border-brand-500/50 shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-lg brand-gradient-btn flex items-center justify-center text-white font-bold text-[11px] shadow-sm overflow-hidden">
                      {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
                      {profile.badgeStatus === 'hiring' && (
                        <div className="absolute bottom-0 inset-x-0 bg-indigo-600 text-[6px] font-black text-center text-white leading-none py-0.5">
                          HIRE
                        </div>
                      )}
                      {profile.badgeStatus === 'open_to_work' && (
                        <div className="absolute bottom-0 inset-x-0 bg-emerald-600 text-[6px] font-black text-center text-white leading-none py-0.5">
                          OPEN
                        </div>
                      )}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-[11px] font-semibold text-white leading-tight truncate max-w-[80px]">
                        {profile.fullName ? profile.fullName.split(' ')[0] : 'Profile'}
                      </div>
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
                  </button>

                  {showProfileMenu && (
                    <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full mt-0 sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-64 max-w-sm glass-dropdown rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 border border-slate-700/80 text-xs">
                      <div className="px-2.5 py-2 border-b border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-white truncate text-xs">{profile.fullName}</span>
                          <UserRoleBadge role={profile.role} badgeStatus={profile.badgeStatus} size="xs" />
                        </div>
                        <div className="text-slate-400 truncate text-[10px] font-mono">{profile.email}</div>
                      </div>

                      <button
                        onClick={() => {
                          handleNavClick('profile');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-left"
                      >
                        <User className="w-3.5 h-3.5 text-brand-400" />
                        Career Profile & Skills
                      </button>

                      <button
                        onClick={() => {
                          handleNavClick('community');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-left"
                      >
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        Community & Referrals
                      </button>

                      <button
                        onClick={() => {
                          handleNavClick('compare');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-left"
                      >
                        <GitCompare className="w-3.5 h-3.5 text-purple-400" />
                        Job Comparison Matrix
                      </button>

                      <button
                        onClick={() => {
                          handleNavClick('analytics');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-left"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                        Personal Analytics
                      </button>

                      <button
                        onClick={() => {
                          handleNavClick('alerts');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-left"
                      >
                        <Bell className="w-3.5 h-3.5 text-amber-400" />
                        Job Alerts
                      </button>

                      <button
                        onClick={() => {
                          setShowSupabaseModal(true);
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-left"
                      >
                        <Database className="w-3.5 h-3.5 text-emerald-400" />
                        Supabase Schema Setup
                      </button>

                      <div className="my-1 border-t border-slate-800" />

                      <button
                        onClick={() => {
                          signInDemoUser();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-left"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        Reset Demo Data
                      </button>

                      <button
                        onClick={() => {
                          signOut();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/30 transition-all text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl brand-gradient-btn text-white text-xs font-bold shadow-md hover:scale-105 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
              >
                {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer Menu Dropdown */}
          {showMobileMenu && (
            <div className="lg:hidden py-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-1.5 animate-in slide-in-from-top-2 duration-150">
              {[
                ...primaryNavItems,
                { id: 'compare' as NavPage, label: 'Compare', icon: GitCompare },
                { id: 'analytics' as NavPage, label: 'Analytics', icon: BarChart3 },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${isActive
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 font-bold'
                        : 'text-slate-300 hover:bg-slate-900'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <SupabaseModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

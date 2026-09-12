import React from 'react';
import { Home, Search, Layers, MessageSquare, Users, User } from 'lucide-react';
import { NavPage } from './Navbar';
import { useChat } from '../../context/ChatContext';

interface MobileNavProps {
  activePage: NavPage;
  setActivePage: (page: NavPage) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activePage, setActivePage }) => {
  const { totalUnreadCount } = useChat();

  const items: { id: NavPage; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Jobs', icon: Search },
    { id: 'community', label: 'Feed', icon: Users },
    { id: 'messages', label: 'Chat', icon: MessageSquare, badge: totalUnreadCount },
    { id: 'applications', label: 'Tracker', icon: Layers },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-40 glass-dropdown border-t border-slate-800/80 px-1 py-1.5 bg-slate-950/90 backdrop-blur-lg">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`relative flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-brand-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-brand-500 text-white text-[8px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

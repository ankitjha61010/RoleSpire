import React, { useState, useRef, useEffect } from 'react';
import { useTheme, ACCENT_THEMES } from '../../context/ThemeContext';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';

interface ThemePickerProps {
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export const ThemePicker: React.FC<ThemePickerProps> = ({ isOpen: controlledIsOpen, onToggle }) => {
  const { themeMode, accentTheme, setThemeMode, setAccentTheme } = useTheme();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDropdownOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleToggle = (next: boolean) => {
    if (onToggle) {
      onToggle(next);
    } else {
      setInternalIsOpen(next);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleToggle(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [controlledIsOpen, onToggle]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => handleToggle(!isDropdownOpen)}
        className={`p-2 rounded-xl transition-all flex items-center gap-1.5 border ${
          isDropdownOpen
            ? 'bg-slate-800 text-white border-brand-500/50 shadow-sm'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border-slate-700/60'
        }`}
        title="Customize Theme & Palette"
        aria-label="Theme settings"
      >
        <Palette className="w-4 h-4 text-brand-400" />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 glass-dropdown rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 border border-slate-700/80">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Appearance & Accents
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 mb-4">
            <button
              onClick={() => setThemeMode('dark')}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all ${
                themeMode === 'dark'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" /> Dark
            </button>
            <button
              onClick={() => setThemeMode('light')}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all ${
                themeMode === 'light'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" /> Light
            </button>
            <button
              onClick={() => setThemeMode('system')}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all ${
                themeMode === 'system'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> Auto
            </button>
          </div>

          {/* Accent Palettes */}
          <div className="text-xs font-medium text-slate-400 mb-2">Accent Palette</div>
          <div className="space-y-1.5">
            {ACCENT_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setAccentTheme(theme.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  accentTheme === theme.id
                    ? 'bg-slate-800 text-white border border-brand-500/40'
                    : 'text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span>{theme.name}</span>
                </div>
                {accentTheme === theme.id && (
                  <span className="text-[10px] bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded font-mono">
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

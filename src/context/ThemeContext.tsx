import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccentTheme, ThemePreference } from '../types';
import { LOCAL_STORAGE_KEYS } from '../lib/supabaseClient';

interface ThemeContextType {
  themeMode: ThemePreference;
  accentTheme: AccentTheme;
  setThemeMode: (mode: ThemePreference) => void;
  setAccentTheme: (accent: AccentTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ACCENT_THEMES: { id: AccentTheme; name: string; color: string; badge: string }[] = [
  { id: 'default', name: 'Indigo Pulse', color: '#6366f1', badge: 'bg-indigo-500' },
  { id: 'ocean', name: 'Ocean Cyan', color: '#06b6d4', badge: 'bg-cyan-500' },
  { id: 'forest', name: 'Emerald Forest', color: '#10b981', badge: 'bg-emerald-500' },
  { id: 'sunset', name: 'Sunset Rose', color: '#f43f5e', badge: 'bg-rose-500' },
  { id: 'midnight', name: 'Amber Gold', color: '#f59e0b', badge: 'bg-amber-500' },
];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME);
    if (saved) {
      try {
        return JSON.parse(saved).themeMode || 'dark';
      } catch {
        return 'dark';
      }
    }
    return 'dark';
  });

  const [accentTheme, setAccentThemeState] = useState<AccentTheme>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME);
    if (saved) {
      try {
        return JSON.parse(saved).accentTheme || 'default';
      } catch {
        return 'default';
      }
    }
    return 'default';
  });

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let isDark = true;
      if (themeMode === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = themeMode === 'dark';
      }

      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    };

    applyTheme();

    // Listen to OS system color scheme changes if in 'system' mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (themeMode === 'system') {
        applyTheme();
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else {
      mediaQuery.addListener(handleSystemChange);
    }

    // Apply accent palette
    root.setAttribute('data-theme', accentTheme);

    // Save to localStorage
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.THEME,
      JSON.stringify({ themeMode, accentTheme })
    );

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemChange);
      } else {
        mediaQuery.removeListener(handleSystemChange);
      }
    };
  }, [themeMode, accentTheme]);

  const setThemeMode = (mode: ThemePreference) => {
    setThemeModeState(mode);
  };

  const setAccentTheme = (accent: AccentTheme) => {
    setAccentThemeState(accent);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, accentTheme, setThemeMode, setAccentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

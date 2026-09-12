import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserSkill } from '../types';
import { supabase, isSupabaseConfigured, LOCAL_STORAGE_KEYS } from '../lib/supabaseClient';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isSupabaseLive: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, fullName: string, password?: string) => Promise<void>;
  signInDemoUser: () => void;
  signOut: () => Promise<void>;
  updateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  addSkill: (skill: UserSkill) => Promise<void>;
  removeSkill: (skillName: string) => Promise<void>;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_abhishek_demo',
  email: 'abhishek@rolespire.io',
  fullName: 'Abhishek Kashyap',
  headline: 'Senior Full Stack & Mobile Engineer',
  bio: 'Product-focused software engineer specialized in React, React Native, TypeScript, Node.js, and high-performance web systems.',
  experienceYears: 3.5,
  currentLocation: 'Ahmedabad, India',
  preferredLocations: ['Ahmedabad', 'Bangalore', 'Remote'],
  expectedSalaryMin: 1600000,
  expectedSalaryCurrency: 'INR',
  remotePreference: 'open',
  skills: [
    { name: 'React', yearsOfExperience: 3.5, proficiency: 'expert' },
    { name: 'TypeScript', yearsOfExperience: 3.0, proficiency: 'advanced' },
    { name: 'React Native', yearsOfExperience: 2.5, proficiency: 'advanced' },
    { name: 'Node.js', yearsOfExperience: 3.0, proficiency: 'advanced' },
    { name: 'MongoDB', yearsOfExperience: 2.5, proficiency: 'intermediate' },
    { name: 'Tailwind CSS', yearsOfExperience: 3.0, proficiency: 'expert' },
    { name: 'PostgreSQL', yearsOfExperience: 2.0, proficiency: 'intermediate' },
  ],
  themePreference: 'dark',
  accentTheme: 'default',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state and subscribe to Supabase auth events
  useEffect(() => {
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    async function initAuth() {
      setIsLoading(true);

      if (isSupabaseConfigured && supabase) {
        try {
          // 1. Get current active session from Supabase
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const authUser = { id: session.user.id, email: session.user.email || '' };
            setUser(authUser);

            // Fetch profile
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profileData) {
              const fullProfile: UserProfile = {
                ...DEFAULT_PROFILE,
                ...profileData,
                skills: DEFAULT_PROFILE.skills,
              };
              setProfile(fullProfile);
              localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_SESSION, JSON.stringify(authUser));
              localStorage.setItem(LOCAL_STORAGE_KEYS.USER_PROFILE, JSON.stringify(fullProfile));
            } else {
              // Create default profile if not present
              const newProf: UserProfile = {
                ...DEFAULT_PROFILE,
                id: session.user.id,
                email: session.user.email || '',
                fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              };
              setProfile(newProf);
              localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_SESSION, JSON.stringify(authUser));
              localStorage.setItem(LOCAL_STORAGE_KEYS.USER_PROFILE, JSON.stringify(newProf));
            }
          } else {
            // Restore from localStorage
            loadStoredOrDemo();
          }

          // 2. Listen to real-time auth changes (LOGIN, LOGOUT, TOKEN_REFRESHED)
          const { data: listener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (event === 'SIGNED_IN' && currentSession?.user) {
              const authUser = { id: currentSession.user.id, email: currentSession.user.email || '' };
              setUser(authUser);

              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentSession.user.id)
                .maybeSingle();

              const prof: UserProfile = {
                ...DEFAULT_PROFILE,
                ...(profileData || {}),
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                fullName: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0] || 'User',
                // `profiles` has no `skills` column (those live in `user_skills`), and a
                // stale localStorage snapshot could carry a null/missing skills array —
                // never let a malformed profile drop this to something scoring can't map over.
                skills: DEFAULT_PROFILE.skills,
              };
              setProfile(prof);
              localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_SESSION, JSON.stringify(authUser));
              localStorage.setItem(LOCAL_STORAGE_KEYS.USER_PROFILE, JSON.stringify(prof));
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setProfile(null);
              localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_SESSION);
              localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_PROFILE);
            }
          });

          authListener = listener;
        } catch (err) {
          console.warn('Supabase auth check warning, restoring local session:', err);
          loadStoredOrDemo();
        }
      } else {
        loadStoredOrDemo();
      }

      setIsLoading(false);
    }

    function loadStoredOrDemo() {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_SESSION);
      const storedProfile = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_PROFILE);

      if (storedUser && storedProfile) {
        try {
          setUser(JSON.parse(storedUser));
          setProfile(JSON.parse(storedProfile));
          return;
        } catch (e) {
          console.error(e);
        }
      }

      // If no stored user, default to demo candidate
      setUser({ id: DEFAULT_PROFILE.id, email: DEFAULT_PROFILE.email });
      setProfile(DEFAULT_PROFILE);
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_SESSION, JSON.stringify({ id: DEFAULT_PROFILE.id, email: DEFAULT_PROFILE.email }));
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER_PROFILE, JSON.stringify(DEFAULT_PROFILE));
    }

    initAuth();

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password?: string) => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          const newUser = { id: data.user.id, email: data.user.email || email };
          
          // Try to fetch profile from DB
          let userProfile: UserProfile = {
            ...DEFAULT_PROFILE,
            id: newUser.id,
            email: newUser.email,
            fullName: data.user.user_metadata?.full_name || email.split('@')[0],
          };

          try {
            const { data: dbProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (dbProfile) {
              userProfile = {
                ...userProfile,
                ...dbProfile,
              };
            }
          } catch (e) {
            console.warn('Profile fetch warning:', e);
          }

          setUser(newUser);
          setProfile(userProfile);
          localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_SESSION, JSON.stringify(newUser));
          localStorage.setItem(LOCAL_STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
        }
      } catch (err: any) {
        console.error('Supabase signIn error:', err);
        throw err;
      }
    } else {
      // Local demo signin
      const newUser = { id: `usr_${Date.now()}`, email };
      const newProfile: UserProfile = {
        ...DEFAULT_PROFILE,
        id: newUser.id,
        email,
        fullName: email.split('@')[0],
      };
      setUser(newUser);
      setProfile(newProfile);
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_SESSION, JSON.stringify(newUser));
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER_PROFILE, JSON.stringify(newProfile));
    }
    setIsLoading(false);
  };

  const signUp = async (email: string, fullName: string, password?: string) => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase && password) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        if (data.user) {
          const newUser = { id: data.user.id, email: data.user.email || email };
          const newProfile: UserProfile = {
            ...DEFAULT_PROFILE,
            id: newUser.id,
            email,
            fullName: fullName || email.split('@')[0],
          };
          setUser(newUser);
          setProfile(newProfile);
          localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_SESSION, JSON.stringify(newUser));
          localStorage.setItem(LOCAL_STORAGE_KEYS.USER_PROFILE, JSON.stringify(newProfile));
        }
      } catch (err: any) {
        // If Supabase rate limit is triggered (e.g. 3-4 emails/hour limit on default SMTP)
        if (err?.message?.includes('rate limit') || err?.code === 'over_email_send_rate_limit') {
          console.warn('Supabase email rate limit reached, continuing in active local session mode.');
          const newUser = { id: `usr_${Date.now()}`, email };
          const newProfile: UserProfile = {
            ...DEFAULT_PROFILE,
            id: newUser.id,
            email,
            fullName: fullName || email.split('@')[0],
          };
          setUser(newUser);
          setProfile(newProfile);
          localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_SESSION, JSON.stringify(newUser));
          localStorage.setItem(LOCAL_STORAGE_KEYS.USER_PROFILE, JSON.stringify(newProfile));
        } else {
          throw err;
        }
      }
    } else {
      const newUser = { id: `usr_${Date.now()}`, email };
      const newProfile: UserProfile = {
        ...DEFAULT_PROFILE,
        id: newUser.id,
        email,
        fullName,
      };
      setUser(newUser);
      setProfile(newProfile);
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_SESSION, JSON.stringify(newUser));
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER_PROFILE, JSON.stringify(newProfile));
    }
    setIsLoading(false);
  };

  const signInDemoUser = () => {
    setUser({ id: DEFAULT_PROFILE.id, email: DEFAULT_PROFILE.email });
    setProfile(DEFAULT_PROFILE);
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_SESSION, JSON.stringify({ id: DEFAULT_PROFILE.id, email: DEFAULT_PROFILE.email }));
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_PROFILE, JSON.stringify(DEFAULT_PROFILE));
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_SESSION);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_PROFILE);
  };

  const updateProfile = async (updated: Partial<UserProfile>) => {
    if (!profile) return;
    const merged: UserProfile = {
      ...profile,
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    setProfile(merged);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_PROFILE, JSON.stringify(merged));

    if (isSupabaseConfigured && supabase && user) {
      try {
        await supabase
          .from('profiles')
          .update({
            full_name: merged.fullName,
            headline: merged.headline,
            company: merged.company,
            bio: merged.bio,
            experience_years: merged.experienceYears,
            current_location: merged.currentLocation,
            preferred_locations: merged.preferredLocations,
            expected_salary_min: merged.expectedSalaryMin,
            remote_preference: merged.remotePreference,
            resume_url: merged.resumeUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      } catch (e) {
        console.warn('Supabase profile update warning:', e);
      }
    }
  };

  const addSkill = async (newSkill: UserSkill) => {
    if (!profile) return;
    const exists = profile.skills.some(
      (s) => s.name.toLowerCase() === newSkill.name.toLowerCase()
    );
    if (exists) return;

    const updatedSkills = [...profile.skills, newSkill];
    await updateProfile({ skills: updatedSkills });
  };

  const removeSkill = async (skillName: string) => {
    if (!profile) return;
    const updatedSkills = profile.skills.filter(
      (s) => s.name.toLowerCase() !== skillName.toLowerCase()
    );
    await updateProfile({ skills: updatedSkills });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isSupabaseLive: isSupabaseConfigured,
        signIn,
        signUp,
        signInDemoUser,
        signOut,
        updateProfile,
        addSkill,
        removeSkill,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

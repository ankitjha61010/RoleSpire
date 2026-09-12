import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder')
);

// Real client if configured
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// LocalStorage helpers for seamless offline/hybrid mode
export const LOCAL_STORAGE_KEYS = {
  USER_PROFILE: 'rolespire_user_profile',
  AUTH_SESSION: 'rolespire_auth_session',
  APPLICATIONS: 'rolespire_applications',
  APPLICATION_EVENTS: 'rolespire_application_events',
  SAVED_JOBS: 'rolespire_saved_jobs',
  CUSTOM_FOLDERS: 'rolespire_custom_folders',
  JOB_ALERTS: 'rolespire_job_alerts',
  THEME: 'rolespire_theme_config',
  COMPARISON_LIST: 'rolespire_comparison_list',
};

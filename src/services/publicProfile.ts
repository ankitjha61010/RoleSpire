import { supabase } from '../lib/supabaseClient';
import { PostAuthor, UserSkill } from '../types';
import { fetchPublicProfileSections } from '../context/ProfileSectionsContext';

export interface PublicProfile extends PostAuthor {
  companyId?: string;
  bio?: string;
  currentLocation?: string;
  experienceYears?: number;
  socialLinks?: Record<string, string>;
  skills: UserSkill[];
  experiences: Awaited<ReturnType<typeof fetchPublicProfileSections>>['experiences'];
  education: Awaited<ReturnType<typeof fetchPublicProfileSections>>['education'];
  certifications: Awaited<ReturnType<typeof fetchPublicProfileSections>>['certifications'];
  projects: Awaited<ReturnType<typeof fetchPublicProfileSections>>['projects'];
}

// Real, cross-account profile lookup by id — used by UserProfilePage so
// viewing someone else's profile no longer depends on an in-memory PostAuthor
// object being threaded through React state.
export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  if (!supabase) return null;

  const [{ data: row, error }, { data: skillRows }, sections] = await Promise.all([
    supabase
      .from('public_profiles')
      .select('id, full_name, headline, company, company_id, avatar_url, cover_image_url, role, badge_status, bio, current_location, experience_years, social_links')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('user_skills')
      .select('id, skill_name, years_of_experience, proficiency')
      .eq('user_id', userId),
    fetchPublicProfileSections(userId),
  ]);

  if (error || !row) return null;

  return {
    id: row.id,
    name: row.full_name || 'RoleSpire Member',
    avatarUrl: row.avatar_url || undefined,
    headline: row.headline || 'Job Seeker',
    company: row.company || undefined,
    companyId: row.company_id || undefined,
    role: row.role || 'job_seeker',
    badgeStatus: row.badge_status || 'none',
    bio: row.bio || undefined,
    currentLocation: row.current_location || undefined,
    experienceYears: row.experience_years ?? undefined,
    socialLinks: row.social_links || undefined,
    skills: (skillRows || []).map((s: any) => ({
      id: s.id,
      name: s.skill_name,
      yearsOfExperience: s.years_of_experience,
      proficiency: s.proficiency,
    })),
    ...sections,
  };
}

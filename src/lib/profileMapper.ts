import { UserProfile } from '../types';

// `profiles` rows come back from Supabase as snake_case; `UserProfile` is
// camelCase throughout the app. Merging a raw DB row directly onto a
// UserProfile (as this file used to do inline in AuthContext) silently drops
// every field because the keys never match — this is the single mapping
// point so that bug can't reappear.
export function dbRowToProfilePatch(row: Record<string, any>): Partial<UserProfile> {
  const patch: Partial<UserProfile> = {};
  if (row.full_name !== undefined) patch.fullName = row.full_name;
  if (row.avatar_url !== undefined) patch.avatarUrl = row.avatar_url ?? undefined;
  if (row.cover_image_url !== undefined) patch.coverImageUrl = row.cover_image_url ?? undefined;
  if (row.headline !== undefined) patch.headline = row.headline;
  if (row.bio !== undefined) patch.bio = row.bio ?? undefined;
  if (row.role !== undefined) patch.role = row.role ?? undefined;
  if (row.badge_status !== undefined) patch.badgeStatus = row.badge_status ?? undefined;
  if (row.company !== undefined) patch.company = row.company ?? undefined;
  if (row.company_id !== undefined) patch.companyId = row.company_id ?? undefined;
  if (row.social_links !== undefined) patch.socialLinks = row.social_links ?? undefined;
  if (row.profile_visibility !== undefined) patch.profileVisibility = row.profile_visibility ?? undefined;
  if (row.experience_years !== undefined) patch.experienceYears = row.experience_years;
  if (row.current_location !== undefined) patch.currentLocation = row.current_location;
  if (row.preferred_locations !== undefined) patch.preferredLocations = row.preferred_locations;
  if (row.expected_salary_min !== undefined) patch.expectedSalaryMin = row.expected_salary_min;
  if (row.expected_salary_currency !== undefined) patch.expectedSalaryCurrency = row.expected_salary_currency;
  if (row.remote_preference !== undefined) patch.remotePreference = row.remote_preference;
  if (row.resume_url !== undefined) patch.resumeUrl = row.resume_url ?? undefined;
  if (row.theme_preference !== undefined) patch.themePreference = row.theme_preference;
  if (row.accent_theme !== undefined) patch.accentTheme = row.accent_theme;
  if (row.created_at !== undefined) patch.createdAt = row.created_at;
  if (row.updated_at !== undefined) patch.updatedAt = row.updated_at;
  return patch;
}

export function profileToDbUpdate(profile: UserProfile): Record<string, any> {
  return {
    full_name: profile.fullName,
    avatar_url: profile.avatarUrl,
    cover_image_url: profile.coverImageUrl,
    headline: profile.headline,
    company: profile.company,
    company_id: profile.companyId || null,
    bio: profile.bio,
    role: profile.role,
    badge_status: profile.badgeStatus,
    social_links: profile.socialLinks || {},
    profile_visibility: profile.profileVisibility,
    experience_years: profile.experienceYears,
    current_location: profile.currentLocation,
    preferred_locations: profile.preferredLocations,
    expected_salary_min: profile.expectedSalaryMin,
    remote_preference: profile.remotePreference,
    resume_url: profile.resumeUrl,
    updated_at: new Date().toISOString(),
  };
}

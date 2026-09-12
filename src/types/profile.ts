export type ThemePreference = 'dark' | 'light' | 'system';
export type AccentTheme = 'default' | 'ocean' | 'forest' | 'sunset' | 'midnight';

export type UserRole = 'job_seeker' | 'recruiter' | 'mentor' | 'founder';
export type UserBadgeStatus = 'open_to_work' | 'hiring' | 'open_to_refer' | 'casually_looking' | 'none';

export interface UserSkill {
  id?: string;
  name: string;
  yearsOfExperience: number;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  website?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  headline: string;
  bio?: string;
  role?: UserRole;
  badgeStatus?: UserBadgeStatus;
  company?: string;
  companyId?: string;
  socialLinks?: SocialLinks;
  profileVisibility?: 'public' | 'connections' | 'private';
  experienceYears: number;
  currentLocation: string;
  preferredLocations: string[];
  expectedSalaryMin: number;
  expectedSalaryCurrency: string;
  remotePreference: 'remote_only' | 'hybrid' | 'onsite' | 'open';
  skills: UserSkill[];
  resumeUrl?: string;
  resumeFileName?: string;
  themePreference: ThemePreference;
  accentTheme: AccentTheme;
  createdAt: string;
  updatedAt: string;
}

export interface Experience {
  id: string;
  userId: string;
  title: string;
  companyId?: string;
  companyName: string;
  location?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

export interface Education {
  id: string;
  userId: string;
  schoolName: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface Certification {
  id: string;
  userId: string;
  name: string;
  issuingOrg?: string;
  issueDate?: string;
  credentialUrl?: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
}

export type SavedFolderType = 'saved' | 'dream_jobs' | 'apply_later' | 'high_priority' | 'interview' | 'custom';

export interface CustomFolder {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  count?: number;
  createdAt: string;
}

export interface SavedJobRecord {
  id: string;
  userId: string;
  jobId: string;
  folderId?: string;
  folderType: SavedFolderType;
  notes?: string;
  savedAt: string;
}

export interface JobAlert {
  id: string;
  userId: string;
  title: string;
  keywords: string[];
  location?: string;
  remoteOnly: boolean;
  minSalary?: number;
  frequency: 'instant' | 'daily' | 'weekly';
  isActive: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
}

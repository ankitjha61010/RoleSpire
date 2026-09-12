export type RemoteType = 'remote' | 'hybrid' | 'onsite';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship';
export type JobSource = 'direct';
export type ApplicationType = 'direct' | 'external';
export type FreshnessStatus = 'hot' | 'active' | 'older' | 'stale';

export interface Job {
  id: string;
  source: JobSource;
  sourceJobId?: string;
  title: string;
  company: string;
  companyLogo?: string;
  companyDomain?: string;
  location: string;
  description: string;
  requirements?: string[];
  benefits?: string[];
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  employmentType: EmploymentType;
  remoteType: RemoteType;
  skills: string[];
  experienceLevel: string; // 'Entry' | 'Mid-Level' | 'Senior' | 'Lead'
  postedAt: string; // ISO String
  updatedAt?: string;
  applyUrl: string;
  applicationType: ApplicationType;
  isActive?: boolean;
  duplicateClusterId?: string;
  isDuplicate?: boolean;
  duplicateSources?: string[];
  
  // Computed runtime scores
  matchScore?: JobMatchScore;
  qualityScore?: JobQualityScore;
  skillGap?: SkillGapAnalysis;
}

export interface JobMatchScore {
  totalScore: number; // 0 - 100
  tier: 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Low Match';
  breakdown: {
    skillsMatch: number; // 0 - 100
    experienceMatch: number; // 0 - 100
    locationMatch: number; // 0 - 100
    salaryMatch: number; // 0 - 100
    preferenceMatch: number; // 0 - 100
  };
  reasons: string[];
}

export interface JobQualityScore {
  score: number; // 0 - 100
  tier: 'Exceptional' | 'High Quality' | 'Standard' | 'Needs Review';
  freshnessLabel: string;
  freshnessStatus: FreshnessStatus;
  reasons: string[];
  flags: {
    hasSalary: boolean;
    hasVerifiedCompany: boolean;
    hasClearSkills: boolean;
    hasDirectApply: boolean;
    isFresh: boolean;
    isDuplicate: boolean;
  };
}

export interface SkillGapAnalysis {
  matchedSkills: string[];
  missingSkills: string[];
  additionalSkills: string[];
  matchPercentage: number;
  recommendationText: string;
}

export interface JobFilters {
  query?: string;
  location?: string;
  remoteType?: RemoteType | 'all';
  employmentType?: EmploymentType | 'all';
  minSalary?: number;
  minExperience?: number;
  experienceLevel?: string;
  skills?: string[];
  company?: string;
  source?: JobSource | 'all';
  datePosted?: '24h' | '3d' | '7d' | '14d' | 'all';
  onlyStrongMatches?: boolean;
  hideApplied?: boolean;
  hideSaved?: boolean;
  minQualityScore?: number;
}

export type JobSortOption = 'best_match' | 'recent' | 'highest_salary' | 'quality' | 'closest';

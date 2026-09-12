import { Job, JobFilters, JobSortOption, JobSource, UserProfile } from '../../types';
import { calculateMatchScore } from '../scoring/matchScoreEngine';
import { calculateQualityScore } from '../scoring/qualityScoreEngine';
import { analyzeSkillGap } from '../scoring/skillGapEngine';
import { clusterAndDeduplicateJobs } from '../dedup/duplicateDetector';
import { supabase } from '../../lib/supabaseClient';

export interface AggregateJobsResult {
  jobs: Job[];
  total: number;
  duplicateCount: number;
}

function rowToJob(row: any): Job {
  return {
    id: row.id,
    source: (row.source as JobSource) || 'direct',
    sourceJobId: row.source_job_id ?? undefined,
    title: row.title,
    company: row.company,
    companyLogo: row.company_logo ?? undefined,
    companyDomain: row.company_domain ?? undefined,
    location: row.location,
    description: row.description,
    requirements: row.requirements || [],
    benefits: row.benefits || [],
    salaryMin: row.salary_min ?? undefined,
    salaryMax: row.salary_max ?? undefined,
    currency: row.currency || 'INR',
    employmentType: row.employment_type,
    remoteType: row.remote_type,
    skills: row.skills || [],
    experienceLevel: row.experience_level,
    postedAt: row.posted_at,
    updatedAt: row.updated_at ?? undefined,
    applyUrl: row.apply_url,
    applicationType: row.application_type || 'direct',
    isActive: row.is_active,
    duplicateClusterId: row.duplicate_cluster_id ?? undefined,
  };
}

export class JobAggregatorService {
  /**
   * Main job query — reads directly from our own Supabase `jobs` table
   * (populated by company admins posting roles), rather than any third-party
   * job board API. No fabricated/sample data is ever mixed in.
   */
  async searchJobs(
    filters: JobFilters = {},
    profile: UserProfile | null = null,
    sort: JobSortOption = 'best_match'
  ): Promise<AggregateJobsResult> {
    let combinedJobs: Job[] = [];

    if (supabase) {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('posted_at', { ascending: false })
        .limit(500);

      if (error) {
        console.warn('Failed to load jobs from database:', error);
      } else if (data) {
        combinedJobs = data.map(rowToJob);
      }
    }

    // 1. Filter listings
    let filtered = combinedJobs.filter((job) => {
      // Keyword search — match every word in the query somewhere across the
      // job's searchable text, rather than requiring the exact phrase. This
      // lets a query like "oracle db" match a job that separately mentions
      // "Oracle" and "database" instead of returning nothing.
      if (filters.query) {
        const tokens = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
        if (tokens.length > 0) {
          const haystack = [
            job.title,
            job.company,
            job.description,
            job.experienceLevel,
            job.location,
            ...(job.skills || []),
          ]
            .join(' ')
            .toLowerCase();
          const allTokensMatch = tokens.every((t) => haystack.includes(t));
          if (!allTokensMatch) return false;
        }
      }

      // Location filter
      if (filters.location) {
        const loc = filters.location.toLowerCase().trim();
        const matchLoc = job.location.toLowerCase().includes(loc);
        if (!matchLoc && job.remoteType !== 'remote') {
          return false;
        }
      }

      // Remote filter
      if (filters.remoteType && filters.remoteType !== 'all') {
        if (job.remoteType !== filters.remoteType) return false;
      }

      // Employment type
      if (filters.employmentType && filters.employmentType !== 'all') {
        if (job.employmentType !== filters.employmentType) return false;
      }

      // Salary filter — most listings don't disclose a salary at all (that
      // isn't the same as "pays below the minimum"), so only exclude a job
      // here when it actually reports a number that falls short.
      if (filters.minSalary && filters.minSalary > 0) {
        const reportedSalary = job.salaryMax || job.salaryMin;
        if (reportedSalary != null && reportedSalary < filters.minSalary) return false;
      }

      // Date posted
      if (filters.datePosted && filters.datePosted !== 'all') {
        const postedMs = new Date(job.postedAt).getTime();
        const nowMs = Date.now();
        const diffHours = (nowMs - postedMs) / (1000 * 60 * 60);

        if (filters.datePosted === '24h' && diffHours > 24) return false;
        if (filters.datePosted === '3d' && diffHours > 72) return false;
        if (filters.datePosted === '7d' && diffHours > 168) return false;
        if (filters.datePosted === '14d' && diffHours > 336) return false;
      }

      return true;
    });

    // 2. Enrich each job with Match, Quality, and Skill Gap scores
    let scoredJobs: Job[] = filtered.map((job) => {
      const matchScore = calculateMatchScore(job, profile);
      const qualityScore = calculateQualityScore(job);
      const skillGap = analyzeSkillGap(job, profile);

      return {
        ...job,
        matchScore,
        qualityScore,
        skillGap,
      };
    });

    // 3. Duplicate Detection & Clustering (still useful once multiple
    // companies cross-post similar-looking roles)
    const { clusteredJobs, duplicateCount } = clusterAndDeduplicateJobs(scoredJobs);
    scoredJobs = clusteredJobs;

    // Filter by Match Score if "Only Strong Matches" is toggled
    if (filters.onlyStrongMatches) {
      scoredJobs = scoredJobs.filter((j) => (j.matchScore?.totalScore || 0) >= 80);
    }

    // Filter by Min Quality Score if set
    if (filters.minQualityScore) {
      scoredJobs = scoredJobs.filter((j) => (j.qualityScore?.score || 0) >= (filters.minQualityScore || 0));
    }

    // 4. Sorting
    scoredJobs.sort((a, b) => {
      if (sort === 'best_match') {
        return (b.matchScore?.totalScore || 0) - (a.matchScore?.totalScore || 0);
      }
      if (sort === 'recent') {
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      }
      if (sort === 'highest_salary') {
        const salA = a.salaryMax || a.salaryMin || 0;
        const salB = b.salaryMax || b.salaryMin || 0;
        return salB - salA;
      }
      if (sort === 'quality') {
        return (b.qualityScore?.score || 0) - (a.qualityScore?.score || 0);
      }
      return 0;
    });

    return {
      jobs: scoredJobs,
      total: scoredJobs.length,
      duplicateCount,
    };
  }
}

export const jobAggregator = new JobAggregatorService();

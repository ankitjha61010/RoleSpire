import { Job, JobFilters, JobSortOption, UserProfile } from '../../types';
import { calculateMatchScore } from '../scoring/matchScoreEngine';
import { calculateQualityScore } from '../scoring/qualityScoreEngine';
import { analyzeSkillGap } from '../scoring/skillGapEngine';
import { clusterAndDeduplicateJobs } from '../dedup/duplicateDetector';
import { AdzunaProvider } from './adzunaProvider';
import { GreenhouseProvider } from './greenhouseProvider';
import { LeverProvider } from './leverProvider';
import { SEED_JOBS } from './sampleJobsData';

export interface AggregateJobsResult {
  jobs: Job[];
  total: number;
  duplicateCount: number;
  isRealApiActive: boolean;
  providersActive: string[];
}

export class JobAggregatorService {
  private adzuna = new AdzunaProvider();
  private greenhouse = new GreenhouseProvider();
  private lever = new LeverProvider();

  /**
   * Main aggregator query function
   */
  async searchJobs(
    filters: JobFilters = {},
    profile: UserProfile | null = null,
    sort: JobSortOption = 'best_match'
  ): Promise<AggregateJobsResult> {
    let combinedJobs: Job[] = [];
    const providersActive: string[] = ['RoleSpire Direct Network'];
    let isRealApiActive = false;

    // 1. Try Adzuna if configured
    if (this.adzuna.isConfigured) {
      try {
        const adzunaResult = await this.adzuna.fetchJobs({
          query: filters.query,
          location: filters.location,
          filters,
        });
        if (adzunaResult.jobs.length > 0) {
          combinedJobs = [...combinedJobs, ...adzunaResult.jobs];
          providersActive.push('Adzuna Live API');
          isRealApiActive = true;
        }
      } catch (err) {
        console.warn('Adzuna fetch failed, using internal verified catalog:', err);
      }
    }

    // Combine with internal verified & real-world seed data
    combinedJobs = [...combinedJobs, ...SEED_JOBS];

    // 2. Filter listings
    let filtered = combinedJobs.filter((job) => {
      // Keyword search (title, company, description, skills)
      if (filters.query) {
        const q = filters.query.toLowerCase().trim();
        const matchTitle = job.title.toLowerCase().includes(q);
        const matchCompany = job.company.toLowerCase().includes(q);
        const matchSkills = (job.skills || []).some((s) => s.toLowerCase().includes(q));
        const matchDesc = job.description.toLowerCase().includes(q);
        if (!matchTitle && !matchCompany && !matchSkills && !matchDesc) {
          return false;
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

      // Salary filter (Min salary in INR or converted)
      if (filters.minSalary && filters.minSalary > 0) {
        const salaryMax = job.salaryMax || job.salaryMin || 0;
        if (salaryMax < filters.minSalary) return false;
      }

      // Source filter
      if (filters.source && filters.source !== 'all') {
        if (job.source !== filters.source) return false;
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

    // 3. Enrich each job with Match, Quality, and Skill Gap scores
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

    // 4. Duplicate Detection & Clustering
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

    // 5. Sorting
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
      isRealApiActive,
      providersActive,
    };
  }
}

export const jobAggregator = new JobAggregatorService();

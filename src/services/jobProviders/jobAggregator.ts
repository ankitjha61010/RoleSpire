import { Job, JobFilters, JobSortOption, UserProfile } from '../../types';
import { calculateMatchScore } from '../scoring/matchScoreEngine';
import { calculateQualityScore } from '../scoring/qualityScoreEngine';
import { analyzeSkillGap } from '../scoring/skillGapEngine';
import { clusterAndDeduplicateJobs } from '../dedup/duplicateDetector';
import { AdzunaProvider } from './adzunaProvider';
import { RemotiveProvider } from './remotiveProvider';
import { ArbeitnowProvider } from './arbeitnowProvider';

export interface AggregateJobsResult {
  jobs: Job[];
  total: number;
  duplicateCount: number;
  isRealApiActive: boolean;
  providersActive: string[];
}

export class JobAggregatorService {
  private adzuna = new AdzunaProvider();
  private remotive = new RemotiveProvider();
  private arbeitnow = new ArbeitnowProvider();

  /**
   * Main aggregator query function — queries all live job providers in parallel
   * and merges genuine results. No fabricated/sample data is ever mixed in.
   */
  async searchJobs(
    filters: JobFilters = {},
    profile: UserProfile | null = null,
    sort: JobSortOption = 'best_match'
  ): Promise<AggregateJobsResult> {
    let combinedJobs: Job[] = [];
    const providersActive: string[] = [];
    let isRealApiActive = false;

    const providerCalls: Promise<void>[] = [];

    // Adzuna requires free API credentials (VITE_ADZUNA_APP_ID / VITE_ADZUNA_APP_KEY)
    if (this.adzuna.isConfigured) {
      providerCalls.push(
        this.adzuna
          .fetchJobs({ query: filters.query, location: filters.location, filters })
          .then((result) => {
            if (result.jobs.length > 0) {
              combinedJobs = [...combinedJobs, ...result.jobs];
              providersActive.push('Adzuna Live API');
              isRealApiActive = true;
            }
          })
          .catch((err) => console.warn('Adzuna fetch failed:', err))
      );
    }

    // Remotive & Arbeitnow are free, public, and require no API key
    providerCalls.push(
      this.remotive
        .fetchJobs({ query: filters.query, location: filters.location, filters })
        .then((result) => {
          if (result.jobs.length > 0) {
            combinedJobs = [...combinedJobs, ...result.jobs];
            providersActive.push('Remotive Live API');
            isRealApiActive = true;
          }
        })
        .catch((err) => console.warn('Remotive fetch failed:', err))
    );

    providerCalls.push(
      this.arbeitnow
        .fetchJobs({ query: filters.query, location: filters.location, filters })
        .then((result) => {
          if (result.jobs.length > 0) {
            combinedJobs = [...combinedJobs, ...result.jobs];
            providersActive.push('Arbeitnow Live API');
            isRealApiActive = true;
          }
        })
        .catch((err) => console.warn('Arbeitnow fetch failed:', err))
    );

    await Promise.all(providerCalls);

    // 2. Filter listings
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

      // Salary filter — most live listings don't disclose a salary at all
      // (that isn't the same as "pays below the minimum"), so only exclude a
      // job here when it actually reports a number that falls short.
      if (filters.minSalary && filters.minSalary > 0) {
        const reportedSalary = job.salaryMax || job.salaryMin;
        if (reportedSalary != null && reportedSalary < filters.minSalary) return false;
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

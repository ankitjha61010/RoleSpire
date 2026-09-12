import { Job, JobSource } from '../../types';
import { JobProvider, JobProviderFetchParams, JobProviderFetchResult } from './types';
import { cleanHtmlDescription } from './htmlUtils';

/**
 * Remotive Job Board API Adapter
 * Free, public, no API key required: https://remotive.com/api/remote-jobs
 */
export class RemotiveProvider implements JobProvider {
  name = 'Remotive';
  id = 'remotive';
  isConfigured = true;

  private inferExperienceLevel(title: string): string {
    const t = title.toLowerCase();
    if (/(staff|principal|lead|architect)/.test(t)) return 'Lead';
    if (/(senior|sr\.?\s)/.test(t)) return 'Senior';
    if (/(junior|jr\.?\s|entry|intern)/.test(t)) return 'Entry';
    return 'Mid-Level';
  }

  private inferEmploymentType(jobType: string): Job['employmentType'] {
    if (jobType === 'part_time') return 'part-time';
    if (jobType === 'contract' || jobType === 'freelance') return 'contract';
    if (jobType === 'internship') return 'internship';
    return 'full-time';
  }

  async fetchJobs(params: JobProviderFetchParams): Promise<JobProviderFetchResult> {
    try {
      const searchParams = new URLSearchParams();
      if (params.query) searchParams.set('search', params.query);

      const url = `https://remotive.com/api/remote-jobs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Remotive API HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const results: any[] = data.jobs || [];

      const normalizedJobs: Job[] = results.map((item) => ({
        id: `remotive_${item.id}`,
        source: 'remotive' as JobSource,
        sourceJobId: String(item.id),
        title: item.title || 'Software Role',
        company: item.company_name || 'Hiring Company',
        // Remotive's logo endpoint (remotive.com/job/{id}/logo) now returns 403 for
        // every job under their free tier, so it's never a real, loadable image —
        // omit it and let the UI fall back to initials instead of a broken icon.
        location: item.candidate_required_location || 'Remote',
        description: cleanHtmlDescription(item.description || ''),
        salaryMin: undefined,
        salaryMax: undefined,
        currency: 'USD',
        employmentType: this.inferEmploymentType(item.job_type),
        remoteType: 'remote',
        skills: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags : [item.category].filter(Boolean),
        experienceLevel: this.inferExperienceLevel(item.title || ''),
        postedAt: item.publication_date || new Date().toISOString(),
        applyUrl: item.url || '#',
        applicationType: 'external',
        isActive: true,
      }));

      return {
        jobs: normalizedJobs,
        totalCount: data['total-job-count'] || normalizedJobs.length,
        page: 1,
        hasMore: false,
        provider: this.name,
        isRealApi: true,
      };
    } catch (err: any) {
      console.warn('Remotive API query error:', err);
      return {
        jobs: [],
        totalCount: 0,
        page: params.page || 1,
        hasMore: false,
        provider: this.name,
        isRealApi: false,
        errorMessage: err.message,
      };
    }
  }
}

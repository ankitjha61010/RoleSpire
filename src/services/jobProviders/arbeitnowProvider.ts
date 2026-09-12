import { Job, JobSource } from '../../types';
import { JobProvider, JobProviderFetchParams, JobProviderFetchResult } from './types';
import { cleanHtmlDescription } from './htmlUtils';

/**
 * Arbeitnow Job Board API Adapter
 * Free, public, no API key required: https://www.arbeitnow.com/api/job-board-api
 * Note: the API does not support server-side search params, only `page`,
 * so query/location filtering happens downstream in the aggregator. To give
 * that filtering a large enough pool to actually find relevant matches, we
 * pull several pages up front instead of just the first one.
 */
export class ArbeitnowProvider implements JobProvider {
  name = 'Arbeitnow';
  id = 'arbeitnow';
  isConfigured = true;
  private readonly maxPages = 5;

  private inferExperienceLevel(title: string): string {
    const t = title.toLowerCase();
    if (/(staff|principal|lead|architect|head of)/.test(t)) return 'Lead';
    if (/(senior|sr\.?\s)/.test(t)) return 'Senior';
    if (/(junior|jr\.?\s|entry|intern|werkstudent|minijob|trainee)/.test(t)) return 'Entry';
    return 'Mid-Level';
  }

  private inferEmploymentType(jobTypes: string[]): Job['employmentType'] {
    const types = (jobTypes || []).map((t) => t.toLowerCase());
    if (types.some((t) => t.includes('teilzeit') || t.includes('part'))) return 'part-time';
    if (types.some((t) => t.includes('praktikum') || t.includes('intern'))) return 'internship';
    if (types.some((t) => t.includes('freelance') || t.includes('contract'))) return 'contract';
    return 'full-time';
  }

  private normalize(item: any): Job {
    return {
      id: `arbeitnow_${item.slug}`,
      source: 'arbeitnow' as JobSource,
      sourceJobId: item.slug,
      title: item.title || 'Job Opening',
      company: item.company_name || 'Hiring Company',
      location: item.location || (item.remote ? 'Remote' : 'Onsite'),
      description: cleanHtmlDescription(item.description || ''),
      currency: 'EUR',
      employmentType: this.inferEmploymentType(item.job_types),
      remoteType: item.remote ? 'remote' : 'onsite',
      skills: Array.isArray(item.tags) ? item.tags : [],
      experienceLevel: this.inferExperienceLevel(item.title || ''),
      postedAt: item.created_at ? new Date(item.created_at * 1000).toISOString() : new Date().toISOString(),
      applyUrl: item.url || '#',
      applicationType: 'external',
      isActive: true,
    };
  }

  private async fetchPage(page: number): Promise<any[]> {
    const response = await fetch(`https://www.arbeitnow.com/api/job-board-api?page=${page}`);
    if (!response.ok) {
      throw new Error(`Arbeitnow API HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data || [];
  }

  async fetchJobs(params: JobProviderFetchParams): Promise<JobProviderFetchResult> {
    try {
      const pageNumbers = Array.from({ length: this.maxPages }, (_, i) => i + 1);
      const pages = await Promise.all(
        pageNumbers.map((page) => this.fetchPage(page).catch(() => []))
      );

      const seen = new Set<string>();
      const normalizedJobs: Job[] = [];
      pages.flat().forEach((item) => {
        if (!item?.slug || seen.has(item.slug)) return;
        seen.add(item.slug);
        normalizedJobs.push(this.normalize(item));
      });

      return {
        jobs: normalizedJobs,
        totalCount: normalizedJobs.length,
        page: 1,
        hasMore: false,
        provider: this.name,
        isRealApi: true,
      };
    } catch (err: any) {
      console.warn('Arbeitnow API query error:', err);
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

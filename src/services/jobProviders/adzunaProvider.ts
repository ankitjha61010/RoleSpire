import { Job, JobSource } from '../../types';
import { JobProvider, JobProviderFetchParams, JobProviderFetchResult } from './types';

/**
 * Adzuna Job Search API Adapter
 * In production with private keys, this routes through Supabase Edge Function `supabase/functions/adzuna-proxy`
 * In frontend mode, if App ID & Key are present in environment variables, it fetches live results.
 */
export class AdzunaProvider implements JobProvider {
  name = 'Adzuna';
  id = 'adzuna';

  private appId = import.meta.env.VITE_ADZUNA_APP_ID || '';
  private appKey = import.meta.env.VITE_ADZUNA_APP_KEY || '';
  private defaultCountry = import.meta.env.VITE_ADZUNA_COUNTRY || 'in'; // 'in', 'us', 'gb'

  get isConfigured(): boolean {
    return Boolean(this.appId && this.appKey);
  }

  async fetchJobs(params: JobProviderFetchParams): Promise<JobProviderFetchResult> {
    if (!this.isConfigured) {
      return {
        jobs: [],
        totalCount: 0,
        page: params.page || 1,
        hasMore: false,
        provider: this.name,
        isRealApi: false,
        errorMessage: 'Adzuna API credentials (VITE_ADZUNA_APP_ID, VITE_ADZUNA_APP_KEY) not configured. Showing verified platform listings.',
      };
    }

    try {
      const page = params.page || 1;
      const country = params.country || this.defaultCountry;
      const query = encodeURIComponent(params.query || 'software engineer');
      const location = params.location ? encodeURIComponent(params.location) : '';
      const resultsPerPage = params.resultsPerPage || 10;

      // Adzuna REST endpoint
      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${this.appId}&app_key=${this.appKey}&results_per_page=${resultsPerPage}&what=${query}${
        location ? `&where=${location}` : ''
      }&content-type=application/json`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Adzuna API HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const results: any[] = data.results || [];

      const normalizedJobs: Job[] = results.map((item) => {
        const title = item.title ? item.title.replace(/<[^>]*>/g, '') : 'Software Role';
        const company = item.company?.display_name || 'Hiring Company';
        const description = item.description ? item.description.replace(/<[^>]*>/g, '') : '';
        const isRemote = (item.title + ' ' + item.description + ' ' + item.location?.display_name).toLowerCase().includes('remote');

        // Extract skills from description
        const commonSkills = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'JavaScript', 'SQL', 'MongoDB', 'Docker', 'PostgreSQL'];
        const detectedSkills = commonSkills.filter((sk) =>
          new RegExp(`\\b${sk}\\b`, 'i').test(title + ' ' + description)
        );

        return {
          id: `adzuna_${item.id}`,
          source: 'adzuna' as JobSource,
          sourceJobId: String(item.id),
          title,
          company,
          location: item.location?.display_name || (isRemote ? 'Remote' : 'India'),
          description,
          salaryMin: item.salary_min ? Math.round(item.salary_min) : undefined,
          salaryMax: item.salary_max ? Math.round(item.salary_max) : undefined,
          currency: country === 'in' ? 'INR' : 'USD',
          employmentType: (item.contract_time === 'full_time' ? 'full-time' : 'full-time') as any,
          remoteType: isRemote ? 'remote' : 'hybrid',
          skills: detectedSkills.length > 0 ? detectedSkills : ['React', 'JavaScript'],
          experienceLevel: 'Mid-Level',
          postedAt: item.created || new Date().toISOString(),
          applyUrl: item.redirect_url || '#',
          applicationType: 'external',
          isActive: true,
        };
      });

      return {
        jobs: normalizedJobs,
        totalCount: data.count || normalizedJobs.length,
        page,
        hasMore: (page * resultsPerPage) < (data.count || 0),
        provider: this.name,
        isRealApi: true,
      };
    } catch (err: any) {
      console.warn('Adzuna API query error:', err);
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

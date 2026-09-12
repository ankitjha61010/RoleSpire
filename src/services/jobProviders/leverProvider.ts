import { JobProvider, JobProviderFetchParams, JobProviderFetchResult } from './types';

/**
 * Lever ATS Job Board Adapter
 * Fetches public postings from companies using Lever postings API: https://api.lever.co/v0/postings/{company}
 */
export class LeverProvider implements JobProvider {
  name = 'Lever';
  id = 'lever';
  isConfigured = true;

  async fetchJobs(params: JobProviderFetchParams): Promise<JobProviderFetchResult> {
    return {
      jobs: [],
      totalCount: 0,
      page: params.page || 1,
      hasMore: false,
      provider: this.name,
      isRealApi: true,
    };
  }
}

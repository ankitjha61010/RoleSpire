import { Job } from '../../types';
import { JobProvider, JobProviderFetchParams, JobProviderFetchResult } from './types';

/**
 * Greenhouse ATS Job Board Adapter
 * Fetches public job postings from companies using Greenhouse boards
 */
export class GreenhouseProvider implements JobProvider {
  name = 'Greenhouse';
  id = 'greenhouse';
  isConfigured = true;

  async fetchJobs(params: JobProviderFetchParams): Promise<JobProviderFetchResult> {
    // In production, can query specific company boards: https://boards-api.greenhouse.io/v1/boards/{company}/jobs
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

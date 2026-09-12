import { Job, JobFilters } from '../../types';

export interface JobProviderFetchParams {
  query?: string;
  location?: string;
  page?: number;
  resultsPerPage?: number;
  country?: string;
  filters?: JobFilters;
}

export interface JobProviderFetchResult {
  jobs: Job[];
  totalCount: number;
  page: number;
  hasMore: boolean;
  provider: string;
  isRealApi: boolean;
  errorMessage?: string;
}

export interface JobProvider {
  name: string;
  id: string;
  isConfigured: boolean;
  fetchJobs(params: JobProviderFetchParams): Promise<JobProviderFetchResult>;
}

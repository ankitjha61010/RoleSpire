import { Job } from '../types';

export interface DerivedCompany {
  name: string;
  jobCount: number;
  locations: string[];
  remoteJobCount: number;
  topSkills: string[];
  sources: string[];
  latestPostedAt: string;
  jobs: Job[];
}

/**
 * Builds a lightweight company directory purely from real, live job listings —
 * no invented headcounts, ratings, culture copy, or employee rosters.
 */
export function deriveCompaniesFromJobs(jobs: Job[]): DerivedCompany[] {
  const byCompany = new Map<string, Job[]>();

  jobs.forEach((job) => {
    const key = (job.company || '').trim();
    if (!key) return;
    const existing = byCompany.get(key) || [];
    existing.push(job);
    byCompany.set(key, existing);
  });

  const companies: DerivedCompany[] = Array.from(byCompany.entries()).map(([name, companyJobs]) => {
    const locations = Array.from(new Set(companyJobs.map((j) => j.location))).slice(0, 5);
    const remoteJobCount = companyJobs.filter((j) => j.remoteType === 'remote').length;

    const skillCounts = new Map<string, number>();
    companyJobs.forEach((j) => (j.skills || []).forEach((s) => skillCounts.set(s, (skillCounts.get(s) || 0) + 1)));
    const topSkills = Array.from(skillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([s]) => s);

    const sources = Array.from(new Set(companyJobs.map((j) => j.source)));
    const latestPostedAt = companyJobs.reduce(
      (latest, j) => (new Date(j.postedAt) > new Date(latest) ? j.postedAt : latest),
      companyJobs[0].postedAt
    );

    return {
      name,
      jobCount: companyJobs.length,
      locations,
      remoteJobCount,
      topSkills,
      sources,
      latestPostedAt,
      jobs: companyJobs,
    };
  });

  return companies.sort((a, b) => b.jobCount - a.jobCount);
}

export function findDerivedCompany(jobs: Job[], companyName: string): DerivedCompany | null {
  const match = jobs.filter(
    (j) => (j.company || '').toLowerCase() === companyName.toLowerCase()
  );
  if (match.length === 0) return null;
  return deriveCompaniesFromJobs(match)[0] || null;
}

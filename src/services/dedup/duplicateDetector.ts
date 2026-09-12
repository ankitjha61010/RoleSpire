import { Job } from '../../types';

function normalizeString(str: string | undefined | null): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Boilerplate gender/diversity qualifiers common in job titles that inflate
// word-overlap similarity without indicating the postings are actually the
// same role (e.g. "Griller (all genders)" vs "Zapfer (all genders)").
const TITLE_FILLER_WORDS = new Set(['m', 'w', 'd', 'f', 'x', 'all', 'genders', 'gender']);

/**
 * Calculates string similarity using Jaccard index on word n-grams
 */
function calculateTextSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeString(a).split(' ').filter((w) => !TITLE_FILLER_WORDS.has(w)));
  const wordsB = new Set(normalizeString(b).split(' ').filter((w) => !TITLE_FILLER_WORDS.has(w)));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) {
      intersection++;
    }
  }

  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Detects duplicate or syndicated job postings and links them under unified clusters
 */
export function clusterAndDeduplicateJobs(jobs: Job[]): {
  clusteredJobs: Job[];
  duplicateCount: number;
} {
  const processedJobs: Job[] = [...jobs];
  const clusterMap = new Map<string, Job[]>();
  let duplicateCount = 0;

  for (let i = 0; i < processedJobs.length; i++) {
    const jobA = processedJobs[i];
    const companyA = normalizeString(jobA.company);
    const titleA = normalizeString(jobA.title);

    for (let j = i + 1; j < processedJobs.length; j++) {
      const jobB = processedJobs[j];
      const companyB = normalizeString(jobB.company);
      const titleB = normalizeString(jobB.title);

      // Check if companies are identical after normalization. A loose substring
      // check here (e.g. "AB".includes("A")) produces massive false positives
      // once the pool has hundreds of differently-named companies.
      const isSameCompany = companyA === companyB && companyA.length > 0;

      if (isSameCompany) {
        const titleSim = calculateTextSimilarity(titleA, titleB);
        const locA = normalizeString(jobA.location);
        const locB = normalizeString(jobB.location);
        const isSameLoc = locA === locB || jobA.remoteType === jobB.remoteType;

        if (titleSim > 0.75 && isSameLoc) {
          const clusterId = jobA.duplicateClusterId || `cluster_${jobA.id}`;
          jobA.duplicateClusterId = clusterId;
          jobB.duplicateClusterId = clusterId;

          jobB.isDuplicate = true;
          duplicateCount++;

          const existingSources = jobA.duplicateSources || [jobA.source];
          if (!existingSources.includes(jobB.source)) {
            existingSources.push(jobB.source);
          }
          jobA.duplicateSources = existingSources;

          if (!clusterMap.has(clusterId)) {
            clusterMap.set(clusterId, [jobA]);
          }
          const cluster = clusterMap.get(clusterId)!;
          if (!cluster.some((j) => j.id === jobB.id)) {
            cluster.push(jobB);
          }
        }
      }
    }
  }

  return {
    clusteredJobs: processedJobs,
    duplicateCount,
  };
}

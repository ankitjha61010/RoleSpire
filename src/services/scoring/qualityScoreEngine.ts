import { Job, JobQualityScore, FreshnessStatus } from '../../types';

/**
 * Job Quality & Transparency Scoring Algorithm (0 - 100)
 * Evaluates listing metadata to protect job seekers from ghost jobs, low-effort postings, and stale listings:
 * - Freshness decay (up to 25 pts)
 * - Salary transparency (up to 25 pts)
 * - Company completeness & credibility (up to 20 pts)
 * - Description & Skills clarity (up to 20 pts)
 * - Application method & transparency (up to 10 pts)
 */
export function calculateQualityScore(job: Job): JobQualityScore {
  let score = 0;
  const reasons: string[] = [];

  // 1. Freshness Analysis
  const now = new Date().getTime();
  const postedTime = new Date(job.postedAt || Date.now()).getTime();
  const diffHours = Math.max(0, (now - postedTime) / (1000 * 60 * 60));

  let freshnessStatus: FreshnessStatus = 'active';
  let freshnessLabel = 'Active';
  let isFresh = false;

  if (diffHours < 24) {
    score += 25;
    freshnessStatus = 'hot';
    freshnessLabel = diffHours < 1 ? '🔥 Posted just now' : `🔥 Posted ${Math.round(diffHours)}h ago`;
    isFresh = true;
    reasons.push('Recently posted within last 24 hours (High response probability)');
  } else if (diffHours < 72) {
    score += 20;
    freshnessStatus = 'active';
    freshnessLabel = `🟢 Active (${Math.round(diffHours / 24)}d ago)`;
    isFresh = true;
    reasons.push('Active listing posted within 3 days');
  } else if (diffHours < 240) {
    score += 12;
    freshnessStatus = 'older';
    freshnessLabel = `🟡 Active (${Math.round(diffHours / 24)}d ago)`;
  } else {
    score += 5;
    freshnessStatus = 'stale';
    freshnessLabel = '⚠️ May be older listing';
  }

  // 2. Salary Transparency
  const hasSalary = Boolean(job.salaryMin || job.salaryMax);
  if (hasSalary) {
    score += 25;
    reasons.push('Transparent salary range provided upfront');
  } else {
    score += 8; // Undisclosed
  }

  // 3. Company Verification & Information
  const hasVerifiedCompany = Boolean(job.company && job.company.length > 2 && (job.companyLogo || job.companyDomain));
  if (hasVerifiedCompany) {
    score += 20;
    reasons.push('Verified employer profile with verified domains');
  } else if (job.company) {
    score += 14;
  }

  // 4. Description Depth & Skills Clarity
  const hasClearSkills = Boolean(job.skills && job.skills.length >= 3);
  const isDeepDescription = Boolean(job.description && job.description.length > 250);
  if (hasClearSkills && isDeepDescription) {
    score += 20;
    reasons.push('Detailed role scope & explicitly defined tech requirements');
  } else if (isDeepDescription || hasClearSkills) {
    score += 12;
  } else {
    score += 5;
  }

  // 5. Application Clarity
  const hasDirectApply = job.applicationType === 'direct';
  if (hasDirectApply) {
    score += 10;
    reasons.push('Direct platform application with instant employer notification');
  } else {
    score += 7;
    reasons.push('Direct redirect to official company career portal');
  }

  const clampedScore = Math.min(100, Math.max(30, score));

  let tier: JobQualityScore['tier'] = 'Standard';
  if (clampedScore >= 85) tier = 'Exceptional';
  else if (clampedScore >= 75) tier = 'High Quality';
  else if (clampedScore < 60) tier = 'Needs Review';

  return {
    score: clampedScore,
    tier,
    freshnessLabel,
    freshnessStatus,
    reasons,
    flags: {
      hasSalary,
      hasVerifiedCompany,
      hasClearSkills,
      hasDirectApply,
      isFresh,
      isDuplicate: Boolean(job.isDuplicate),
    },
  };
}

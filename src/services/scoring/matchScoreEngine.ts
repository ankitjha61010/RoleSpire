import { Job, JobMatchScore, UserProfile } from '../../types';

/**
 * Deterministic Multidimensional Job Matching Algorithm
 * Evaluates:
 * 1. Skills overlap (Weighted 40%)
 * 2. Experience level compatibility (Weighted 20%)
 * 3. Location match (Weighted 15%)
 * 4. Salary expectations (Weighted 15%)
 * 5. Remote & work style preference (Weighted 10%)
 */
export function calculateMatchScore(job: Job, profile: UserProfile | null): JobMatchScore {
  if (!profile) {
    return {
      totalScore: 75,
      tier: 'Good Match',
      breakdown: {
        skillsMatch: 75,
        experienceMatch: 75,
        locationMatch: 75,
        salaryMatch: 75,
        preferenceMatch: 75,
      },
      reasons: ['Default guest match based on market demand.'],
    };
  }

  const userSkillNames = profile.skills.map((s) => s.name.toLowerCase().trim());
  const jobSkills = (job.skills || []).map((s) => s.toLowerCase().trim());

  // 1. Skills Match (0 - 100)
  let skillsScore = 50;
  let matchedSkillsCount = 0;
  if (jobSkills.length > 0) {
    matchedSkillsCount = jobSkills.filter((js) =>
      userSkillNames.some((us) => us === js || us.includes(js) || js.includes(us))
    ).length;
    skillsScore = Math.min(100, Math.round((matchedSkillsCount / jobSkills.length) * 100));
  } else {
    // If job has no explicit skills listed, check title match with user headline/skills
    const titleLower = job.title.toLowerCase();
    const titleSkillMatch = userSkillNames.some((us) => titleLower.includes(us));
    skillsScore = titleSkillMatch ? 85 : 65;
  }

  // 2. Experience Match (0 - 100)
  let expScore = 80;
  const userExp = profile.experienceYears;
  const jobExpLevel = job.experienceLevel.toLowerCase();
  if (jobExpLevel.includes('entry') || jobExpLevel.includes('junior')) {
    expScore = userExp >= 0 && userExp <= 3 ? 100 : 75;
  } else if (jobExpLevel.includes('mid')) {
    expScore = userExp >= 2 && userExp <= 6 ? 100 : userExp > 6 ? 90 : 65;
  } else if (jobExpLevel.includes('senior')) {
    expScore = userExp >= 5 ? 100 : userExp >= 3 ? 80 : 50;
  } else if (jobExpLevel.includes('lead') || jobExpLevel.includes('principal')) {
    expScore = userExp >= 7 ? 100 : userExp >= 4 ? 70 : 40;
  }

  // 3. Location Match (0 - 100)
  let locationScore = 60;
  const jobLocationLower = job.location.toLowerCase();
  const userLocLower = profile.currentLocation.toLowerCase();
  const preferredLocs = (profile.preferredLocations || []).map((l) => l.toLowerCase());

  if (job.remoteType === 'remote') {
    locationScore = 100;
  } else if (
    jobLocationLower.includes(userLocLower) ||
    userLocLower.includes(jobLocationLower)
  ) {
    locationScore = 100;
  } else if (
    preferredLocs.some((pref) => jobLocationLower.includes(pref) || pref.includes(jobLocationLower))
  ) {
    locationScore = 90;
  } else {
    locationScore = 45;
  }

  // 4. Salary Match (0 - 100)
  let salaryScore = 75;
  if (job.salaryMin || job.salaryMax) {
    const jobMidSalary = job.salaryMax
      ? (job.salaryMin ? (job.salaryMin + job.salaryMax) / 2 : job.salaryMax)
      : (job.salaryMin || 0);

    if (profile.expectedSalaryMin > 0) {
      if (jobMidSalary >= profile.expectedSalaryMin) {
        salaryScore = 100;
      } else {
        const ratio = jobMidSalary / profile.expectedSalaryMin;
        salaryScore = Math.max(30, Math.min(95, Math.round(ratio * 90)));
      }
    } else {
      salaryScore = 85;
    }
  } else {
    salaryScore = 70; // Salary undisclosed
  }

  // 5. Work Style / Remote Preference Match (0 - 100)
  let preferenceScore = 80;
  if (profile.remotePreference === 'remote_only') {
    preferenceScore = job.remoteType === 'remote' ? 100 : job.remoteType === 'hybrid' ? 60 : 30;
  } else if (profile.remotePreference === 'hybrid') {
    preferenceScore = job.remoteType === 'hybrid' || job.remoteType === 'remote' ? 100 : 70;
  } else if (profile.remotePreference === 'onsite') {
    preferenceScore = job.remoteType === 'onsite' ? 100 : 80;
  } else {
    preferenceScore = 95; // Open to anything
  }

  // Weighted aggregation
  const total = Math.round(
    skillsScore * 0.4 +
    expScore * 0.2 +
    locationScore * 0.15 +
    salaryScore * 0.15 +
    preferenceScore * 0.1
  );

  const clampedTotal = Math.max(25, Math.min(99, total));

  let tier: JobMatchScore['tier'] = 'Low Match';
  if (clampedTotal >= 85) tier = 'Strong Match';
  else if (clampedTotal >= 70) tier = 'Good Match';
  else if (clampedTotal >= 55) tier = 'Moderate Match';

  // Build human-friendly match reasons
  const reasons: string[] = [];
  if (skillsScore >= 80) {
    reasons.push(`Strong overlap with your skills (${matchedSkillsCount} required skills matched)`);
  }
  if (expScore >= 90) {
    reasons.push(`Matches your ${userExp} years of professional experience`);
  }
  if (locationScore === 100) {
    reasons.push(job.remoteType === 'remote' ? '100% Remote flexibility' : `Located in your preferred city (${job.location})`);
  }
  if (salaryScore >= 90 && (job.salaryMin || job.salaryMax)) {
    reasons.push('Meets or exceeds your expected compensation range');
  }

  if (reasons.length === 0) {
    reasons.push('Relevant role based on your professional headline and background');
  }

  return {
    totalScore: clampedTotal,
    tier,
    breakdown: {
      skillsMatch: skillsScore,
      experienceMatch: expScore,
      locationMatch: locationScore,
      salaryMatch: salaryScore,
      preferenceMatch: preferenceScore,
    },
    reasons,
  };
}

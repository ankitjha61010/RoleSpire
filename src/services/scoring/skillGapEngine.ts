import { Job, SkillGapAnalysis, UserProfile } from '../../types';

/**
 * Skill Gap Analysis Engine
 * Compares user's current skillset with the specific job's technical stack
 * Outputs matched skills, missing/weak skills, additional bonus skills, and actionable advice.
 */
export function analyzeSkillGap(job: Job, profile: UserProfile | null): SkillGapAnalysis {
  if (!profile || !profile.skills || profile.skills.length === 0) {
    return {
      matchedSkills: [],
      missingSkills: job.skills || [],
      additionalSkills: [],
      matchPercentage: 0,
      recommendationText: 'Add your skills in your Profile to unlock instant skill gap comparison and learning recommendations.',
    };
  }

  const userSkillMap = new Map<string, string>();
  profile.skills.forEach((s) => {
    if (!s.name) return;
    userSkillMap.set(s.name.toLowerCase().trim(), s.name);
  });

  const jobSkills = (job.skills || []).filter(Boolean);
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  jobSkills.forEach((reqSkill) => {
    const reqLower = reqSkill.toLowerCase().trim();
    let foundMatch = false;

    for (const [userKey, originalName] of userSkillMap.entries()) {
      if (userKey === reqLower || userKey.includes(reqLower) || reqLower.includes(userKey)) {
        matchedSkills.push(originalName);
        foundMatch = true;
        break;
      }
    }

    if (!foundMatch) {
      missingSkills.push(reqSkill);
    }
  });

  // Additional skills the user has that aren't strictly required
  const additionalSkills = profile.skills
    .filter((s) => s.name && !matchedSkills.includes(s.name))
    .map((s) => s.name);

  const totalRequired = jobSkills.length;
  const matchPercentage = totalRequired > 0 
    ? Math.round((matchedSkills.length / totalRequired) * 100) 
    : 85;

  let recommendationText = '';
  if (matchPercentage >= 85) {
    recommendationText = `You are a top-tier candidate! You possess ${matchedSkills.length} of ${totalRequired} core requirements. Highlight your relevant projects in your application.`;
  } else if (matchPercentage >= 60) {
    const topMissing = missingSkills.slice(0, 2).join(' and ');
    recommendationText = `Strong candidate profile. You match ${matchedSkills.length} key skills. Learning or demonstrating ${topMissing} can push your match above 90%.`;
  } else if (matchPercentage >= 35) {
    const topMissing = missingSkills.slice(0, 3).join(', ');
    recommendationText = `Moderate alignment. To stand out for this role, emphasize transferable skills and consider upskilling in: ${topMissing}.`;
  } else {
    recommendationText = `This position requires several specialized skills outside your primary stack (${missingSkills.slice(0, 3).join(', ')}).`;
  }

  return {
    matchedSkills: Array.from(new Set(matchedSkills)),
    missingSkills: Array.from(new Set(missingSkills)),
    additionalSkills: Array.from(new Set(additionalSkills)),
    matchPercentage,
    recommendationText,
  };
}

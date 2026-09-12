import { JobFilters, RemoteType } from '../../types';

export interface ParsedSearchQuery {
  rawQuery: string;
  cleanedKeyword: string;
  extractedFilters: Partial<JobFilters>;
  appliedTags: { label: string; type: keyof JobFilters; value: any }[];
}

/**
 * Natural language search parser for job queries
 * Extracts locations, remote status, compensation limits, experience years, and date constraints
 */
export function parseNaturalLanguageQuery(query: string): ParsedSearchQuery {
  if (!query || !query.trim()) {
    return {
      rawQuery: '',
      cleanedKeyword: '',
      extractedFilters: {},
      appliedTags: [],
    };
  }

  let text = query.trim();
  const extractedFilters: Partial<JobFilters> = {};
  const appliedTags: ParsedSearchQuery['appliedTags'] = [];

  // 1. Detect Remote / Hybrid / Onsite
  if (/\b(remote|work from home|wfh|anywhere)\b/i.test(text)) {
    extractedFilters.remoteType = 'remote' as RemoteType;
    appliedTags.push({ label: '🌐 Remote', type: 'remoteType', value: 'remote' });
    text = text.replace(/\b(remote|work from home|wfh|anywhere)\b/gi, ' ');
  } else if (/\b(hybrid)\b/i.test(text)) {
    extractedFilters.remoteType = 'hybrid' as RemoteType;
    appliedTags.push({ label: '🏢 Hybrid', type: 'remoteType', value: 'hybrid' });
    text = text.replace(/\b(hybrid)\b/gi, ' ');
  } else if (/\b(onsite|on-site|in-office)\b/i.test(text)) {
    extractedFilters.remoteType = 'onsite' as RemoteType;
    appliedTags.push({ label: '📍 On-site', type: 'remoteType', value: 'onsite' });
    text = text.replace(/\b(onsite|on-site|in-office)\b/gi, ' ');
  }

  // 2. Detect Salary specifications (e.g. ₹10 LPA, 15L+, 80k, $120k)
  const lpaMatch = text.match(/(?:above|min|over|>|>=|₹)?\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakh|lakhs|l\+?)\b/i);
  if (lpaMatch) {
    const lpa = parseFloat(lpaMatch[1]);
    const annualSalary = Math.round(lpa * 100000);
    extractedFilters.minSalary = annualSalary;
    appliedTags.push({ label: `💰 ₹${lpa} LPA+`, type: 'minSalary', value: annualSalary });
    text = text.replace(lpaMatch[0], ' ');
  } else {
    const usdMatch = text.match(/(?:above|min|over|>|>=|\$)?\s*(\d+)\s*k\b/i);
    if (usdMatch) {
      const k = parseInt(usdMatch[1], 10);
      const annual = k * 1000;
      extractedFilters.minSalary = annual;
      appliedTags.push({ label: `💰 $${k}k+`, type: 'minSalary', value: annual });
      text = text.replace(usdMatch[0], ' ');
    }
  }

  // 3. Detect Experience requirements (e.g. "for 3 years experience", "2+ yrs", "5 yrs exp")
  const expMatch = text.match(/(?:for\s+)?(\d+)(?:\+|-|\s+to\s+\d+)?\s*(?:years?|yrs?)(?:\s*(?:of\s*)?experience|\s*exp)?/i);
  if (expMatch) {
    const years = parseInt(expMatch[1], 10);
    extractedFilters.minExperience = years;
    appliedTags.push({ label: `⏳ ${years}+ yrs exp`, type: 'minExperience', value: years });
    text = text.replace(expMatch[0], ' ');
  }

  // 4. Detect Freshness / Date posted (e.g. "posted today", "24 hours", "this week")
  if (/\b(today|24\s*hours?|last\s*24h)\b/i.test(text)) {
    extractedFilters.datePosted = '24h';
    appliedTags.push({ label: '🔥 Posted Today', type: 'datePosted', value: '24h' });
    text = text.replace(/\b(today|24\s*hours?|last\s*24h|posted\s+today)\b/gi, ' ');
  } else if (/\b(this\s*week|past\s*week|7\s*days?)\b/i.test(text)) {
    extractedFilters.datePosted = '7d';
    appliedTags.push({ label: '📅 Past 7 Days', type: 'datePosted', value: '7d' });
    text = text.replace(/\b(this\s*week|past\s*week|7\s*days?)\b/gi, ' ');
  }

  // 5. Detect Locations (in Ahmedabad, in Bangalore, in London, etc.)
  const locationInMatch = text.match(/\bin\s+([A-Za-z\s]+?)(?=\s+(?:jobs|developer|engineer|roles|above|for|$))/i);
  if (locationInMatch) {
    const loc = locationInMatch[1].trim();
    if (loc && loc.length > 2 && !['the', 'any', 'my'].includes(loc.toLowerCase())) {
      extractedFilters.location = loc;
      appliedTags.push({ label: `📍 ${loc}`, type: 'location', value: loc });
      text = text.replace(locationInMatch[0], ' ');
    }
  }

  // Clean remaining text
  const cleanedKeyword = text
    .replace(/\b(jobs|job|openings|positions|roles|vacancies|looking for|find|developer|engineer|hiring|wanted)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanedKeyword) {
    extractedFilters.query = cleanedKeyword;
  }

  return {
    rawQuery: query,
    cleanedKeyword,
    extractedFilters,
    appliedTags,
  };
}

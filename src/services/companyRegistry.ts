// Real official India company registry lookup — Ministry of Corporate Affairs
// (MCA) "Registrars of Companies (RoC)-wise Company Master Data", served via
// data.gov.in. This is genuine government filing data (CIN, status, capital,
// registered address, incorporation date) for ~3.6M registered companies.
//
// Hard limitation (verified directly against the live API): it only supports
// an exact, full, case-sensitive match on CompanyName (or CIN) — no partial
// or fuzzy search, no wildcards. That's a constraint of the government API
// itself, not a choice made here.

const API_KEY = import.meta.env.VITE_DATA_GOV_IN_API_KEY || '';
const RESOURCE_ID = import.meta.env.VITE_DATA_GOV_IN_COMPANY_RESOURCE_ID || '';

export const isCompanyRegistryConfigured = Boolean(API_KEY && RESOURCE_ID);

export interface CompanyRegistryRecord {
  cin: string;
  name: string;
  rocCode: string;
  category: string;
  subCategory: string;
  companyClass: string;
  authorizedCapital: string;
  paidupCapital: string;
  registrationDate: string;
  registeredAddress: string;
  listingStatus: string;
  status: string;
  stateCode: string;
  indianOrForeign: string;
  nicCode: string;
  industrialClassification: string;
}

function normalizeRecord(raw: any): CompanyRegistryRecord {
  return {
    cin: raw.CIN || '',
    name: raw.CompanyName || '',
    rocCode: raw.CompanyROCcode || '',
    category: raw.CompanyCategory || '',
    subCategory: raw.CompanySubCategory || '',
    companyClass: raw.CompanyClass || '',
    authorizedCapital: raw.AuthorizedCapital || '',
    paidupCapital: raw.PaidupCapital || '',
    registrationDate: raw.CompanyRegistrationdate_date || '',
    registeredAddress: raw.Registered_Office_Address || '',
    listingStatus: raw.Listingstatus || '',
    status: raw.CompanyStatus || '',
    stateCode: raw.CompanyStateCode || '',
    indianOrForeign: raw['CompanyIndian/Foreign Company'] || '',
    nicCode: raw.nic_code || '',
    industrialClassification: raw.CompanyIndustrialClassification || '',
  };
}

// A CIN is a fixed 21-character code, e.g. U67120RJ1996PTC011402
const CIN_PATTERN = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/i;

async function queryRegistry(field: 'CompanyName' | 'CIN', value: string): Promise<CompanyRegistryRecord | null> {
  if (!isCompanyRegistryConfigured) {
    throw new Error('Company registry lookup is not configured (missing data.gov.in API key/resource ID).');
  }

  const url = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&limit=1&filters[${field}]=${encodeURIComponent(value)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Registry API HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  const records: any[] = data.records || [];
  if (records.length === 0) return null;
  return normalizeRecord(records[0]);
}

/**
 * Looks up a company by its exact registered legal name or its CIN.
 * Auto-detects which one was entered and normalizes casing for the name path
 * (the underlying filter is case-sensitive and matches records stored in
 * upper case), but the input still has to be the complete legal name.
 */
export async function lookupCompany(query: string): Promise<CompanyRegistryRecord | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  if (CIN_PATTERN.test(trimmed)) {
    return queryRegistry('CIN', trimmed.toUpperCase());
  }

  return queryRegistry('CompanyName', trimmed.toUpperCase());
}

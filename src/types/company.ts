export type CompanyMemberRole = 'admin' | 'member';

export interface Company {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  coverImageUrl?: string;
  industry?: string;
  hqLocation?: string;
  website?: string;
  about?: string;
  companySize?: string;
  foundedYear?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyMember {
  companyId: string;
  userId: string;
  role: CompanyMemberRole;
  joinedAt: string;
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Experience, Education, Certification, Project } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

interface ProfileSectionsContextType {
  experiences: Experience[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
  isLoading: boolean;
  addExperience: (data: Omit<Experience, 'id' | 'userId'>) => Promise<void>;
  removeExperience: (id: string) => Promise<void>;
  addEducation: (data: Omit<Education, 'id' | 'userId'>) => Promise<void>;
  removeEducation: (id: string) => Promise<void>;
  addCertification: (data: Omit<Certification, 'id' | 'userId'>) => Promise<void>;
  removeCertification: (id: string) => Promise<void>;
  addProject: (data: Omit<Project, 'id' | 'userId'>) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
}

const ProfileSectionsContext = createContext<ProfileSectionsContextType | undefined>(undefined);

const LOCAL_KEY = 'rolespire_profile_sections';

interface LocalSections {
  experiences: Experience[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
}

function loadLocal(): LocalSections {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to empty defaults
  }
  return { experiences: [], education: [], certifications: [], projects: [] };
}

function saveLocal(sections: LocalSections) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(sections));
}

const expFromRow = (row: any): Experience => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  companyId: row.company_id ?? undefined,
  companyName: row.company_name,
  location: row.location ?? undefined,
  employmentType: row.employment_type ?? undefined,
  startDate: row.start_date,
  endDate: row.end_date ?? undefined,
  isCurrent: row.is_current,
  description: row.description ?? undefined,
});

const eduFromRow = (row: any): Education => ({
  id: row.id,
  userId: row.user_id,
  schoolName: row.school_name,
  degree: row.degree ?? undefined,
  fieldOfStudy: row.field_of_study ?? undefined,
  startDate: row.start_date ?? undefined,
  endDate: row.end_date ?? undefined,
  description: row.description ?? undefined,
});

const certFromRow = (row: any): Certification => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  issuingOrg: row.issuing_org ?? undefined,
  issueDate: row.issue_date ?? undefined,
  credentialUrl: row.credential_url ?? undefined,
});

const projFromRow = (row: any): Project => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  description: row.description ?? undefined,
  url: row.url ?? undefined,
  startDate: row.start_date ?? undefined,
  endDate: row.end_date ?? undefined,
});

export const ProfileSectionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isRealSession } = useAuth();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      if (!profile) {
        setIsLoading(false);
        return;
      }

      if (supabase && isRealSession) {
        const [expRes, eduRes, certRes, projRes] = await Promise.all([
          supabase.from('experiences').select('*').eq('user_id', profile.id).order('start_date', { ascending: false }),
          supabase.from('education').select('*').eq('user_id', profile.id).order('start_date', { ascending: false }),
          supabase.from('certifications').select('*').eq('user_id', profile.id).order('issue_date', { ascending: false }),
          supabase.from('projects').select('*').eq('user_id', profile.id).order('start_date', { ascending: false }),
        ]);
        if (cancelled) return;
        setExperiences((expRes.data || []).map(expFromRow));
        setEducation((eduRes.data || []).map(eduFromRow));
        setCertifications((certRes.data || []).map(certFromRow));
        setProjects((projRes.data || []).map(projFromRow));
      } else {
        const local = loadLocal();
        setExperiences(local.experiences);
        setEducation(local.education);
        setCertifications(local.certifications);
        setProjects(local.projects);
      }
      setIsLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, isRealSession]);

  const persistLocal = (next: Partial<LocalSections>) => {
    const merged = {
      experiences,
      education,
      certifications,
      projects,
      ...next,
    };
    saveLocal(merged);
  };

  const addExperience: ProfileSectionsContextType['addExperience'] = async (data) => {
    if (!profile) return;
    if (supabase && isRealSession) {
      const { data: row, error } = await supabase
        .from('experiences')
        .insert({
          user_id: profile.id,
          title: data.title,
          company_id: data.companyId || null,
          company_name: data.companyName,
          location: data.location,
          employment_type: data.employmentType,
          start_date: data.startDate,
          end_date: data.endDate || null,
          is_current: data.isCurrent,
          description: data.description,
        })
        .select()
        .single();
      if (!error && row) setExperiences((prev) => [expFromRow(row), ...prev]);
    } else {
      const newRow: Experience = { id: `exp_${Date.now()}`, userId: profile.id, ...data };
      const next = [newRow, ...experiences];
      setExperiences(next);
      persistLocal({ experiences: next });
    }
  };

  const removeExperience = async (id: string) => {
    if (supabase && isRealSession) {
      await supabase.from('experiences').delete().eq('id', id);
    }
    const next = experiences.filter((e) => e.id !== id);
    setExperiences(next);
    if (!isRealSession) persistLocal({ experiences: next });
  };

  const addEducation: ProfileSectionsContextType['addEducation'] = async (data) => {
    if (!profile) return;
    if (supabase && isRealSession) {
      const { data: row, error } = await supabase
        .from('education')
        .insert({
          user_id: profile.id,
          school_name: data.schoolName,
          degree: data.degree,
          field_of_study: data.fieldOfStudy,
          start_date: data.startDate || null,
          end_date: data.endDate || null,
          description: data.description,
        })
        .select()
        .single();
      if (!error && row) setEducation((prev) => [eduFromRow(row), ...prev]);
    } else {
      const newRow: Education = { id: `edu_${Date.now()}`, userId: profile.id, ...data };
      const next = [newRow, ...education];
      setEducation(next);
      persistLocal({ education: next });
    }
  };

  const removeEducation = async (id: string) => {
    if (supabase && isRealSession) {
      await supabase.from('education').delete().eq('id', id);
    }
    const next = education.filter((e) => e.id !== id);
    setEducation(next);
    if (!isRealSession) persistLocal({ education: next });
  };

  const addCertification: ProfileSectionsContextType['addCertification'] = async (data) => {
    if (!profile) return;
    if (supabase && isRealSession) {
      const { data: row, error } = await supabase
        .from('certifications')
        .insert({
          user_id: profile.id,
          name: data.name,
          issuing_org: data.issuingOrg,
          issue_date: data.issueDate || null,
          credential_url: data.credentialUrl,
        })
        .select()
        .single();
      if (!error && row) setCertifications((prev) => [certFromRow(row), ...prev]);
    } else {
      const newRow: Certification = { id: `cert_${Date.now()}`, userId: profile.id, ...data };
      const next = [newRow, ...certifications];
      setCertifications(next);
      persistLocal({ certifications: next });
    }
  };

  const removeCertification = async (id: string) => {
    if (supabase && isRealSession) {
      await supabase.from('certifications').delete().eq('id', id);
    }
    const next = certifications.filter((c) => c.id !== id);
    setCertifications(next);
    if (!isRealSession) persistLocal({ certifications: next });
  };

  const addProject: ProfileSectionsContextType['addProject'] = async (data) => {
    if (!profile) return;
    if (supabase && isRealSession) {
      const { data: row, error } = await supabase
        .from('projects')
        .insert({
          user_id: profile.id,
          name: data.name,
          description: data.description,
          url: data.url,
          start_date: data.startDate || null,
          end_date: data.endDate || null,
        })
        .select()
        .single();
      if (!error && row) setProjects((prev) => [projFromRow(row), ...prev]);
    } else {
      const newRow: Project = { id: `proj_${Date.now()}`, userId: profile.id, ...data };
      const next = [newRow, ...projects];
      setProjects(next);
      persistLocal({ projects: next });
    }
  };

  const removeProject = async (id: string) => {
    if (supabase && isRealSession) {
      await supabase.from('projects').delete().eq('id', id);
    }
    const next = projects.filter((p) => p.id !== id);
    setProjects(next);
    if (!isRealSession) persistLocal({ projects: next });
  };

  return (
    <ProfileSectionsContext.Provider
      value={{
        experiences,
        education,
        certifications,
        projects,
        isLoading,
        addExperience,
        removeExperience,
        addEducation,
        removeEducation,
        addCertification,
        removeCertification,
        addProject,
        removeProject,
      }}
    >
      {children}
    </ProfileSectionsContext.Provider>
  );
};

export const useProfileSections = () => {
  const context = useContext(ProfileSectionsContext);
  if (!context) throw new Error('useProfileSections must be used within a ProfileSectionsProvider');
  return context;
};

// Fetch another user's public profile sections by id — used by UserProfilePage.
// Only meaningful against real Supabase data; the local/demo sandbox has no
// cross-account directory to look anyone else up in.
export async function fetchPublicProfileSections(userId: string) {
  if (!supabase) {
    return { experiences: [], education: [], certifications: [], projects: [] };
  }
  const [expRes, eduRes, certRes, projRes] = await Promise.all([
    supabase.from('experiences').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
    supabase.from('education').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
    supabase.from('certifications').select('*').eq('user_id', userId).order('issue_date', { ascending: false }),
    supabase.from('projects').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
  ]);
  return {
    experiences: (expRes.data || []).map(expFromRow),
    education: (eduRes.data || []).map(eduFromRow),
    certifications: (certRes.data || []).map(certFromRow),
    projects: (projRes.data || []).map(projFromRow),
  };
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Job } from '../types';
import { LOCAL_STORAGE_KEYS } from '../lib/supabaseClient';

interface ComparisonContextType {
  comparedJobs: Job[];
  addJobToCompare: (job: Job) => boolean; // returns false if max reached
  removeJobFromCompare: (jobId: string) => void;
  clearComparison: () => void;
  isJobInComparison: (jobId: string) => boolean;
  bestOptionJobId: string | null;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comparedJobs, setComparedJobs] = useState<Job[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.COMPARISON_LIST);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.COMPARISON_LIST, JSON.stringify(comparedJobs));
  }, [comparedJobs]);

  const addJobToCompare = (job: Job): boolean => {
    if (comparedJobs.some((j) => j.id === job.id)) return true;
    if (comparedJobs.length >= 3) return false;
    setComparedJobs((prev) => [...prev, job]);
    return true;
  };

  const removeJobFromCompare = (jobId: string) => {
    setComparedJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const clearComparison = () => {
    setComparedJobs([]);
  };

  const isJobInComparison = (jobId: string) => comparedJobs.some((j) => j.id === jobId);

  // Compute best option among the compared jobs
  const bestOptionJobId = comparedJobs.length > 0
    ? [...comparedJobs].sort((a, b) => {
        const scoreA = (a.matchScore?.totalScore || 70) * 0.6 + (a.qualityScore?.score || 70) * 0.4;
        const scoreB = (b.matchScore?.totalScore || 70) * 0.6 + (b.qualityScore?.score || 70) * 0.4;
        return scoreB - scoreA;
      })[0]?.id || null
    : null;

  return (
    <ComparisonContext.Provider
      value={{
        comparedJobs,
        addJobToCompare,
        removeJobFromCompare,
        clearComparison,
        isJobInComparison,
        bestOptionJobId,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};

export const useJobComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) throw new Error('useJobComparison must be used within a ComparisonProvider');
  return context;
};

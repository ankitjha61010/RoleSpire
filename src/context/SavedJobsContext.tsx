import React, { createContext, useContext, useEffect, useState } from 'react';
import { CustomFolder, Job, SavedFolderType, SavedJobRecord } from '../types';
import { LOCAL_STORAGE_KEYS } from '../lib/supabaseClient';

const INITIAL_FOLDERS: CustomFolder[] = [
  { id: 'fld_dream', userId: 'usr_abhishek_demo', name: 'Dream Companies', color: '#ec4899', icon: 'sparkles', createdAt: new Date().toISOString() },
  { id: 'fld_high_pri', userId: 'usr_abhishek_demo', name: 'High Priority (This Week)', color: '#f59e0b', icon: 'flame', createdAt: new Date().toISOString() },
  { id: 'fld_remote', userId: 'usr_abhishek_demo', name: '100% Remote Leads', color: '#06b6d4', icon: 'globe', createdAt: new Date().toISOString() },
];

const INITIAL_SAVED_RECORDS: SavedJobRecord[] = [
  { id: 'sav_1', userId: 'usr_abhishek_demo', jobId: 'job_linear_02', folderType: 'dream_jobs', notes: 'Loved their offline sync architecture presentation.', savedAt: new Date().toISOString() },
  { id: 'sav_2', userId: 'usr_abhishek_demo', jobId: 'job_airbnb_10', folderType: 'high_priority', notes: 'Prepare design system portfolio before submitting.', savedAt: new Date().toISOString() },
];

interface SavedJobsContextType {
  savedRecords: SavedJobRecord[];
  customFolders: CustomFolder[];
  saveJob: (jobId: string, folderType?: SavedFolderType, folderId?: string, notes?: string) => void;
  removeSavedJob: (jobId: string) => void;
  isJobSaved: (jobId: string) => boolean;
  getSavedJobRecord: (jobId: string) => SavedJobRecord | undefined;
  createCustomFolder: (name: string, color?: string, icon?: string) => void;
  deleteCustomFolder: (folderId: string) => void;
  updateSavedJobNote: (jobId: string, notes: string) => void;
}

const SavedJobsContext = createContext<SavedJobsContextType | undefined>(undefined);

export const SavedJobsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedRecords, setSavedRecords] = useState<SavedJobRecord[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.SAVED_JOBS);
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_SAVED_RECORDS; }
    }
    return INITIAL_SAVED_RECORDS;
  });

  const [customFolders, setCustomFolders] = useState<CustomFolder[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CUSTOM_FOLDERS);
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_FOLDERS; }
    }
    return INITIAL_FOLDERS;
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SAVED_JOBS, JSON.stringify(savedRecords));
  }, [savedRecords]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOM_FOLDERS, JSON.stringify(customFolders));
  }, [customFolders]);

  const saveJob = (jobId: string, folderType: SavedFolderType = 'saved', folderId?: string, notes?: string) => {
    setSavedRecords((prev) => {
      const exists = prev.find((r) => r.jobId === jobId);
      if (exists) {
        return prev.map((r) =>
          r.jobId === jobId ? { ...r, folderType, folderId, notes: notes !== undefined ? notes : r.notes } : r
        );
      }
      const newRecord: SavedJobRecord = {
        id: `sav_${Date.now()}`,
        userId: 'usr_abhishek_demo',
        jobId,
        folderType,
        folderId,
        notes: notes || '',
        savedAt: new Date().toISOString(),
      };
      return [newRecord, ...prev];
    });
  };

  const removeSavedJob = (jobId: string) => {
    setSavedRecords((prev) => prev.filter((r) => r.jobId !== jobId));
  };

  const isJobSaved = (jobId: string) => savedRecords.some((r) => r.jobId === jobId);

  const getSavedJobRecord = (jobId: string) => savedRecords.find((r) => r.jobId === jobId);

  const createCustomFolder = (name: string, color = '#6366f1', icon = 'folder') => {
    const newFolder: CustomFolder = {
      id: `fld_${Date.now()}`,
      userId: 'usr_abhishek_demo',
      name,
      color,
      icon,
      createdAt: new Date().toISOString(),
    };
    setCustomFolders((prev) => [...prev, newFolder]);
  };

  const deleteCustomFolder = (folderId: string) => {
    setCustomFolders((prev) => prev.filter((f) => f.id !== folderId));
    // Revert saved jobs in this folder to general 'saved'
    setSavedRecords((prev) =>
      prev.map((r) => (r.folderId === folderId ? { ...r, folderType: 'saved', folderId: undefined } : r))
    );
  };

  const updateSavedJobNote = (jobId: string, notes: string) => {
    setSavedRecords((prev) =>
      prev.map((r) => (r.jobId === jobId ? { ...r, notes } : r))
    );
  };

  return (
    <SavedJobsContext.Provider
      value={{
        savedRecords,
        customFolders,
        saveJob,
        removeSavedJob,
        isJobSaved,
        getSavedJobRecord,
        createCustomFolder,
        deleteCustomFolder,
        updateSavedJobNote,
      }}
    >
      {children}
    </SavedJobsContext.Provider>
  );
};

export const useSavedJobs = () => {
  const context = useContext(SavedJobsContext);
  if (!context) throw new Error('useSavedJobs must be used within a SavedJobsProvider');
  return context;
};

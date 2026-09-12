import React, { createContext, useContext, useEffect, useState } from 'react';
import { CustomFolder, Job, SavedFolderType, SavedJobRecord } from '../types';
import { LOCAL_STORAGE_KEYS } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

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
  const { profile } = useAuth();
  const [savedRecords, setSavedRecords] = useState<SavedJobRecord[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.SAVED_JOBS);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  const [customFolders, setCustomFolders] = useState<CustomFolder[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CUSTOM_FOLDERS);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
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
        userId: profile?.id || 'guest',
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
      userId: profile?.id || 'guest',
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

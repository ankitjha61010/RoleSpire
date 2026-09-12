import React, { createContext, useContext, useEffect, useState } from 'react';
import { JobAlert } from '../types';
import { LOCAL_STORAGE_KEYS } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

interface AlertsContextType {
  alerts: JobAlert[];
  createAlert: (alert: Omit<JobAlert, 'id' | 'userId' | 'createdAt'>) => void;
  toggleAlert: (id: string) => void;
  deleteAlert: (id: string) => void;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export const AlertsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<JobAlert[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.JOB_ALERTS);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.JOB_ALERTS, JSON.stringify(alerts));
  }, [alerts]);

  const createAlert = (alertData: Omit<JobAlert, 'id' | 'userId' | 'createdAt'>) => {
    const newAlert: JobAlert = {
      ...alertData,
      id: `alt_${Date.now()}`,
      userId: profile?.id || 'guest',
      createdAt: new Date().toISOString(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const toggleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const deleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <AlertsContext.Provider value={{ alerts, createAlert, toggleAlert, deleteAlert }}>
      {children}
    </AlertsContext.Provider>
  );
};

export const useJobAlerts = () => {
  const context = useContext(AlertsContext);
  if (!context) throw new Error('useJobAlerts must be used within an AlertsProvider');
  return context;
};

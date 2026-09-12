import React, { createContext, useContext, useEffect, useState } from 'react';
import { JobAlert } from '../types';
import { LOCAL_STORAGE_KEYS } from '../lib/supabaseClient';

const INITIAL_ALERTS: JobAlert[] = [
  {
    id: 'alt_1',
    userId: 'usr_abhishek_demo',
    title: 'React Native & Mobile Lead (Ahmedabad / Remote)',
    keywords: ['React Native', 'Mobile Lead', 'iOS', 'Android'],
    location: 'Ahmedabad',
    remoteOnly: false,
    minSalary: 1800000,
    frequency: 'daily',
    isActive: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastTriggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'alt_2',
    userId: 'usr_abhishek_demo',
    title: 'Remote MERN & Full Stack > ₹20 LPA',
    keywords: ['MERN', 'Full Stack', 'Node.js', 'React'],
    remoteOnly: true,
    minSalary: 2000000,
    frequency: 'instant',
    isActive: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastTriggeredAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
];

interface AlertsContextType {
  alerts: JobAlert[];
  createAlert: (alert: Omit<JobAlert, 'id' | 'userId' | 'createdAt'>) => void;
  toggleAlert: (id: string) => void;
  deleteAlert: (id: string) => void;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export const AlertsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<JobAlert[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.JOB_ALERTS);
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_ALERTS; }
    }
    return INITIAL_ALERTS;
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.JOB_ALERTS, JSON.stringify(alerts));
  }, [alerts]);

  const createAlert = (alertData: Omit<JobAlert, 'id' | 'userId' | 'createdAt'>) => {
    const newAlert: JobAlert = {
      ...alertData,
      id: `alt_${Date.now()}`,
      userId: 'usr_abhishek_demo',
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

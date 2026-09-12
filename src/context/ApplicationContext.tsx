import React, { createContext, useContext, useEffect, useState } from 'react';
import { Application, ApplicationEvent, ApplicationEventType, ApplicationStatus, FollowUpReminder, Job } from '../types';
import { LOCAL_STORAGE_KEYS, supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

interface ApplicationContextType {
  applications: Application[];
  events: ApplicationEvent[];
  reminders: FollowUpReminder[];
  createApplication: (data: Partial<Application>, job?: Job) => Promise<Application>;
  updateApplicationStatus: (id: string, newStatus: ApplicationStatus) => Promise<void>;
  updateApplication: (id: string, data: Partial<Application>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  addTimelineEvent: (applicationId: string, eventType: ApplicationEventType, title: string, description?: string) => Promise<void>;
  setFollowUpReminder: (applicationId: string, daysOrDate: number | string) => Promise<void>;
  getApplicationById: (id: string) => Application | undefined;
  getApplicationEvents: (applicationId: string) => ApplicationEvent[];
  requestBrowserNotificationPermission: () => Promise<boolean>;
}

export const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export const ApplicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<Application[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.APPLICATIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  const [events, setEvents] = useState<ApplicationEvent[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.APPLICATION_EVENTS);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.APPLICATION_EVENTS, JSON.stringify(events));
  }, [events]);

  // Compute active follow-up reminders
  const reminders: FollowUpReminder[] = applications
    .filter((app) => app.followUpDate && !app.followUpCompleted && app.status !== 'rejected' && app.status !== 'offer')
    .map((app) => {
      const now = new Date().getTime();
      const due = new Date(app.followUpDate!).getTime();
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      return {
        applicationId: app.id,
        jobTitle: app.jobTitle,
        companyName: app.companyName,
        dueDate: app.followUpDate!,
        daysRemaining: diffDays,
        isOverdue: diffDays < 0,
      };
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const requestBrowserNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const createApplication = async (data: Partial<Application>, job?: Job): Promise<Application> => {
    const newApp: Application = {
      id: `app_${Date.now()}`,
      userId: profile?.id || 'guest',
      jobId: job?.id || data.jobId,
      companyName: data.companyName || job?.company || 'Hiring Organization',
      jobTitle: data.jobTitle || job?.title || 'Open Position',
      status: data.status || 'applied',
      location: data.location || job?.location,
      salaryOffered: data.salaryOffered || (job?.salaryMin ? `₹${job.salaryMin.toLocaleString()}` : undefined),
      contactPerson: data.contactPerson,
      contactEmail: data.contactEmail,
      appliedAt: new Date().toISOString(),
      matchScore: job?.matchScore?.totalScore || 85,
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setApplications((prev) => [newApp, ...prev]);

    // Add initial applied event
    await addTimelineEvent(newApp.id, 'applied', 'Application Submitted', 'Recorded application in RoleSpire tracker.');

    return newApp;
  };

  const updateApplicationStatus = async (id: string, newStatus: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id
          ? { ...app, status: newStatus, updatedAt: new Date().toISOString() }
          : app
      )
    );

    // Auto-create corresponding timeline event
    const statusTitles: Record<ApplicationStatus, string> = {
      saved: 'Saved for later review',
      applied: 'Applied to role',
      assessment: 'Moved to Technical Assessment',
      interview: 'Interview Scheduled / In Progress',
      offer: '🎉 Job Offer Received!',
      rejected: 'Application Closed / Rejected',
    };

    const eventTypes: Record<ApplicationStatus, ApplicationEventType> = {
      saved: 'note_added',
      applied: 'applied',
      assessment: 'assessment',
      interview: 'technical_interview',
      offer: 'offer_received',
      rejected: 'rejected',
    };

    await addTimelineEvent(id, eventTypes[newStatus], statusTitles[newStatus]);
  };

  const updateApplication = async (id: string, data: Partial<Application>) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, ...data, updatedAt: new Date().toISOString() } : app
      )
    );
  };

  const deleteApplication = async (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
    setEvents((prev) => prev.filter((ev) => ev.applicationId !== id));
  };

  const addTimelineEvent = async (
    applicationId: string,
    eventType: ApplicationEventType,
    title: string,
    description?: string
  ) => {
    const newEvent: ApplicationEvent = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      applicationId,
      userId: profile?.id || 'guest',
      eventType,
      title,
      description,
      eventDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setEvents((prev) => [newEvent, ...prev]);
  };

  const setFollowUpReminder = async (applicationId: string, daysOrDate: number | string) => {
    let targetDate: string;
    if (typeof daysOrDate === 'number') {
      const d = new Date();
      d.setDate(d.getDate() + daysOrDate);
      targetDate = d.toISOString();
    } else {
      targetDate = new Date(daysOrDate).toISOString();
    }

    await updateApplication(applicationId, {
      followUpDate: targetDate,
      followUpCompleted: false,
    });

    await addTimelineEvent(
      applicationId,
      'note_added',
      'Follow-up Reminder Set',
      `Reminder scheduled for ${new Date(targetDate).toLocaleDateString()}`
    );

    // Request notification permission if not yet enabled
    requestBrowserNotificationPermission();
  };

  const getApplicationById = (id: string) => applications.find((a) => a.id === id);
  const getApplicationEvents = (applicationId: string) =>
    events
      .filter((e) => e.applicationId === applicationId)
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  return (
    <ApplicationContext.Provider
      value={{
        applications,
        events,
        reminders,
        createApplication,
        updateApplicationStatus,
        updateApplication,
        deleteApplication,
        addTimelineEvent,
        setFollowUpReminder,
        getApplicationById,
        getApplicationEvents,
        requestBrowserNotificationPermission,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplications = () => {
  const context = useContext(ApplicationContext);
  if (!context) throw new Error('useApplications must be used within an ApplicationProvider');
  return context;
};

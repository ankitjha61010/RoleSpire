export type ApplicationStatus = 
  | 'saved'
  | 'applied'
  | 'assessment'
  | 'interview'
  | 'offer'
  | 'rejected';

export interface Application {
  id: string;
  userId: string;
  jobId?: string;
  companyName: string;
  jobTitle: string;
  status: ApplicationStatus;
  location?: string;
  salaryOffered?: string;
  contactPerson?: string;
  contactEmail?: string;
  appliedAt: string;
  interviewDate?: string;
  followUpDate?: string;
  followUpCompleted?: boolean;
  matchScore?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Enriched
  events?: ApplicationEvent[];
}

export type ApplicationEventType = 
  | 'applied' 
  | 'screening' 
  | 'technical_interview' 
  | 'assessment' 
  | 'hr_interview' 
  | 'offer_received' 
  | 'rejected' 
  | 'note_added' 
  | 'followup_sent';

export interface ApplicationEvent {
  id: string;
  applicationId: string;
  userId: string;
  eventType: ApplicationEventType;
  title: string;
  description?: string;
  eventDate: string;
  createdAt: string;
}

export interface FollowUpReminder {
  applicationId: string;
  jobTitle: string;
  companyName: string;
  dueDate: string;
  daysRemaining: number;
  isOverdue: boolean;
}

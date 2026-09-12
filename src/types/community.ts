export type PostCategory = 'referral' | 'hiring' | 'interview_tips' | 'salary_insight' | 'showcase' | 'general';
export type ConnectionStatus = 'none' | 'pending' | 'accepted' | 'rejected';

export interface PostAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
  headline: string;
  company?: string;
  isRecruiter?: boolean;
  role?: 'job_seeker' | 'recruiter' | 'mentor' | 'founder';
  badgeStatus?: 'open_to_work' | 'hiring' | 'open_to_refer' | 'casually_looking' | 'none';
}

export interface PostComment {
  id: string;
  postId: string;
  author: PostAuthor;
  content: string;
  createdAt: string;
  likesCount: number;
}

export interface CommunityPost {
  id: string;
  author: PostAuthor;
  category: PostCategory;
  title: string;
  content: string;
  tags: string[];
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  comments?: PostComment[];
  createdAt: string;
  jobLink?: string;
  companyTarget?: string;
}

export interface ChatUser {
  id: string;
  name: string;
  avatarUrl?: string;
  headline: string;
  company: string;
  isOnline: boolean;
  isRecruiter?: boolean;
  role?: 'job_seeker' | 'recruiter' | 'mentor' | 'founder';
  badgeStatus?: 'open_to_work' | 'hiring' | 'open_to_refer' | 'casually_looking' | 'none';
  lastSeen?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participant: ChatUser;
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: string;
}

export interface ConnectionRequest {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  senderAvatar?: string;
  senderHeadline: string;
  senderCompany?: string;
  status: ConnectionStatus;
  createdAt: string;
}

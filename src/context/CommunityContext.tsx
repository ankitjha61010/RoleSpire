import React, { createContext, useContext, useEffect, useState } from 'react';
import { CommunityPost, PostCategory, PostComment, PostAuthor, ConnectionStatus, ConnectionRequest } from '../types';
import { useAuth } from './AuthContext';

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post_1',
    author: {
      id: 'usr_priya_rzp',
      name: 'Priya Sharma',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=60',
      headline: 'Lead Tech Recruiter @ Razorpay',
      company: 'Razorpay',
      isRecruiter: true,
      role: 'recruiter',
      badgeStatus: 'hiring',
    },
    category: 'hiring',
    title: '🚀 Hiring Senior React Native & Frontend Leads for Checkout Team (Ahmedabad / Bangalore)',
    content: 'Hey everyone! My team at Razorpay is actively hiring Senior React Native Engineers with 3+ years experience. Hybrid flexibility, competitive CTC (₹24L - ₹32L) + ESOPs. DM me directly or drop your profile link below for an instant fast-tracked interview loop!',
    tags: ['React Native', 'Hiring', 'Fintech', 'Referral'],
    likesCount: 24,
    isLiked: false,
    commentsCount: 3,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    companyTarget: 'Razorpay',
    comments: [
      {
        id: 'c_1',
        postId: 'post_1',
        author: {
          id: 'usr_abhishek_demo',
          name: 'Abhishek Kashyap',
          headline: 'Senior Full Stack & Mobile Engineer',
          company: 'Engineer',
          role: 'job_seeker',
          badgeStatus: 'open_to_work',
        },
        content: 'Hi Priya! Just sent you a DM with my portfolio and React Native checkout architecture repo.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        likesCount: 4,
      },
      {
        id: 'c_2',
        postId: 'post_1',
        author: {
          id: 'usr_rohit',
          name: 'Rohit Verma',
          headline: 'Mobile Developer',
          company: 'Fintech',
          role: 'job_seeker',
          badgeStatus: 'casually_looking',
        },
        content: 'Is this role open to candidates with 2.5 years of React Native experience?',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        likesCount: 1,
      },
    ],
  },
  {
    id: 'post_2',
    author: {
      id: 'usr_arjun_linear',
      name: 'Arjun Mehta',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
      headline: 'Staff Engineer @ Linear (Ex-Stripe)',
      company: 'Linear',
      role: 'mentor',
      badgeStatus: 'open_to_refer',
    },
    category: 'interview_tips',
    title: '💡 How I passed the Linear & Stripe Frontend System Design Interviews',
    content: `Here are 3 core focus areas that interviewers evaluate in top-tier tech rounds:
1. State Synchronization & Offline-first architecture (CRDTs, optimistic UI, WebSocket rollback).
2. Browser Rendering Ergonomics: keeping 60fps animations off the main JS thread using CSS transform and requestAnimationFrame.
3. API idempotency: designing resilient retry mechanisms for payment transactions.

Happy to refer strong candidates for our Remote Product Engineering opening! Send me a message.`,
    tags: ['InterviewTips', 'SystemDesign', 'React', 'Remote'],
    likesCount: 48,
    isLiked: true,
    commentsCount: 6,
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    companyTarget: 'Linear',
    comments: [
      {
        id: 'c_3',
        postId: 'post_2',
        author: {
          id: 'usr_neha',
          name: 'Neha Kapoor',
          headline: 'Senior Frontend Engineer',
          role: 'job_seeker',
          badgeStatus: 'open_to_work',
        },
        content: 'Spot on about optimistic UI rollbacks! This was asked in my Round 2 system design.',
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        likesCount: 3,
      },
    ],
  },
  {
    id: 'post_3',
    author: {
      id: 'usr_vikram_swiggy',
      name: 'Vikram Patel',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
      headline: 'Engineering Manager @ Swiggy',
      company: 'Swiggy',
      role: 'founder',
      badgeStatus: 'hiring',
    },
    category: 'referral',
    title: '⚡ Swiggy Frontend Platform & Next.js Roles (Direct Referral)',
    content: 'Offering direct employee referrals for Frontend Platform Engineers (3-6 years exp) in Bangalore / Remote. If you have experience with Next.js SSR performance, core web vitals, and micro-frontends, ping me with your resume!',
    tags: ['Swiggy', 'Referral', 'Next.js', 'Frontend'],
    likesCount: 31,
    isLiked: false,
    commentsCount: 2,
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    companyTarget: 'Swiggy',
  },
];

import { supabase } from '../lib/supabaseClient';

interface CommunityContextType {
  posts: CommunityPost[];
  createPost: (data: { title: string; content: string; category: PostCategory; tags: string[]; companyTarget?: string }) => void;
  toggleLikePost: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
  // Connection Request & Real-time WebSocket methods
  connections: Record<string, ConnectionStatus>;
  sendConnectionRequest: (user: PostAuthor) => void;
  acceptConnectionRequest: (userId: string) => void;
  getConnectionStatus: (userId: string) => ConnectionStatus;
  incomingRequests: ConnectionRequest[];
}

const INITIAL_CONNECTIONS: Record<string, ConnectionStatus> = {
  usr_arjun_linear: 'accepted',
};

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem('rolespire_community_posts');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_POSTS; }
    }
    return INITIAL_POSTS;
  });

  const [connections, setConnections] = useState<Record<string, ConnectionStatus>>(() => {
    const saved = localStorage.getItem('rolespire_connections');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_CONNECTIONS; }
    }
    return INITIAL_CONNECTIONS;
  });

  const [incomingRequests, setIncomingRequests] = useState<ConnectionRequest[]>(() => {
    const saved = localStorage.getItem('rolespire_incoming_requests');
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('rolespire_community_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('rolespire_connections', JSON.stringify(connections));
  }, [connections]);

  useEffect(() => {
    localStorage.setItem('rolespire_incoming_requests', JSON.stringify(incomingRequests));
  }, [incomingRequests]);

  // Real-time Supabase Broadcast Channel (WebSocket) for Live Connection Events
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel('rolespire_community_connections', {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'connection_request' }, (payload) => {
        const req = payload.payload as ConnectionRequest;
        if (req.receiverId === profile?.id) {
          setIncomingRequests((prev) => [req, ...prev.filter((r) => r.id !== req.id)]);
        }
      })
      .on('broadcast', { event: 'connection_accepted' }, (payload) => {
        const { senderId, receiverId } = payload.payload;
        if (senderId === profile?.id || receiverId === profile?.id) {
          const targetId = senderId === profile?.id ? receiverId : senderId;
          setConnections((prev) => ({ ...prev, [targetId]: 'accepted' }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const sendConnectionRequest = (targetUser: PostAuthor) => {
    // Set status as 'pending' until the other user accepts
    setConnections((prev) => ({
      ...prev,
      [targetUser.id]: 'pending',
    }));

    const req: ConnectionRequest = {
      id: `req_${Date.now()}`,
      senderId: profile?.id || 'usr_abhishek_demo',
      receiverId: targetUser.id,
      senderName: profile?.fullName || 'Abhishek Kashyap',
      senderAvatar: profile?.avatarUrl,
      senderHeadline: profile?.headline || 'Senior Engineer',
      senderCompany: profile?.currentLocation || 'Tech Lead',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Broadcast over Supabase Realtime WebSocket channel
    if (supabase) {
      supabase.channel('rolespire_community_connections').send({
        type: 'broadcast',
        event: 'connection_request',
        payload: req,
      });
    }

    // Realistic simulation: when sending to an active member/recruiter like Priya Sharma,
    // they review and accept the connection request after 4 seconds with a notification
    setTimeout(() => {
      setConnections((prev) => ({
        ...prev,
        [targetUser.id]: 'accepted',
      }));
    }, 4000);
  };

  const acceptConnectionRequest = (userId: string) => {
    setConnections((prev) => ({
      ...prev,
      [userId]: 'accepted',
    }));
    setIncomingRequests((prev) => prev.filter((r) => r.senderId !== userId));

    if (supabase) {
      supabase.channel('rolespire_community_connections').send({
        type: 'broadcast',
        event: 'connection_accepted',
        payload: { senderId: userId, receiverId: profile?.id },
      });
    }
  };

  const getConnectionStatus = (userId: string): ConnectionStatus => {
    return connections[userId] || 'none';
  };

  const createPost = (data: { title: string; content: string; category: PostCategory; tags: string[]; companyTarget?: string }) => {
    const newPost: CommunityPost = {
      id: `post_${Date.now()}`,
      author: {
        id: profile?.id || 'usr_guest',
        name: profile?.fullName || 'Community Engineer',
        headline: profile?.headline || 'Software Engineer',
        company: profile?.currentLocation || 'Tech Community',
      },
      category: data.category,
      title: data.title,
      content: data.content,
      tags: data.tags.length > 0 ? data.tags : ['Career'],
      likesCount: 1,
      isLiked: true,
      commentsCount: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      companyTarget: data.companyTarget,
    };

    setPosts((prev) => [newPost, ...prev]);
  };

  const toggleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      })
    );
  };

  const addComment = (postId: string, content: string) => {
    if (!content.trim()) return;

    const newComment: PostComment = {
      id: `c_${Date.now()}`,
      postId,
      author: {
        id: profile?.id || 'usr_guest',
        name: profile?.fullName || 'Community Engineer',
        headline: profile?.headline || 'Software Engineer',
      },
      content,
      createdAt: new Date().toISOString(),
      likesCount: 0,
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const comments = [...(p.comments || []), newComment];
          return {
            ...p,
            comments,
            commentsCount: comments.length,
          };
        }
        return p;
      })
    );
  };

  return (
    <CommunityContext.Provider
      value={{
        posts,
        createPost,
        toggleLikePost,
        addComment,
        connections,
        sendConnectionRequest,
        acceptConnectionRequest,
        getConnectionStatus,
        incomingRequests,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) throw new Error('useCommunity must be used within a CommunityProvider');
  return context;
};

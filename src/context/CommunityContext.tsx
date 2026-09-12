import React, { createContext, useContext, useEffect, useState } from 'react';
import { CommunityPost, PostCategory, PostComment, PostAuthor, ConnectionStatus, ConnectionRequest } from '../types';
import { useAuth } from './AuthContext';
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

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem('rolespire_community_posts');
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  const [connections, setConnections] = useState<Record<string, ConnectionStatus>>(() => {
    const saved = localStorage.getItem('rolespire_connections');
    if (saved) {
      try { return JSON.parse(saved); } catch { return {}; }
    }
    return {};
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
      senderId: profile?.id || 'usr_guest',
      receiverId: targetUser.id,
      senderName: profile?.fullName || 'Community Member',
      senderAvatar: profile?.avatarUrl,
      senderHeadline: profile?.headline || 'Software Engineer',
      senderCompany: profile?.company,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Broadcast over Supabase Realtime WebSocket channel — the receiving user's
    // own session flips this to 'accepted' via the 'connection_accepted' listener above.
    if (supabase) {
      supabase.channel('rolespire_community_connections').send({
        type: 'broadcast',
        event: 'connection_request',
        payload: req,
      });
    }
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
        name: profile?.fullName || 'Community Member',
        headline: profile?.headline || 'Software Engineer',
        company: profile?.company,
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

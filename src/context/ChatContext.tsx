import React, { createContext, useContext, useEffect, useState } from 'react';
import { ChatMessage, ChatUser, Conversation } from '../types';
import { useAuth } from './AuthContext';

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_priya_rzp',
    participant: {
      id: 'usr_priya_rzp',
      name: 'Priya Sharma',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=60',
      headline: 'Tech Recruiter',
      company: 'Razorpay',
      isOnline: true,
      isRecruiter: true,
      role: 'recruiter',
      badgeStatus: 'hiring',
    },
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    lastMessage: {
      id: 'm_last_1',
      conversationId: 'conv_priya_rzp',
      senderId: 'usr_priya_rzp',
      receiverId: 'usr_abhishek_demo',
      text: 'Hi Abhishek! We reviewed your profile for the Senior React Native Checkout position. When are you free for a technical screen this week?',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      isRead: false,
    },
  },
  {
    id: 'conv_arjun_linear',
    participant: {
      id: 'usr_arjun_linear',
      name: 'Arjun Mehta',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
      headline: 'Staff Engineer',
      company: 'Linear',
      isOnline: false,
      role: 'mentor',
      badgeStatus: 'open_to_refer',
      lastSeen: '2 hours ago',
    },
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastMessage: {
      id: 'm_last_2',
      conversationId: 'conv_arjun_linear',
      senderId: 'usr_abhishek_demo',
      receiverId: 'usr_arjun_linear',
      text: 'Thanks for the referral to Linear, Arjun! Submitted the take-home project yesterday.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
  },
  {
    id: 'conv_sarah_stripe',
    participant: {
      id: 'usr_sarah_stripe',
      name: 'Sarah Jenkins',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=60',
      headline: 'Senior Talent Partner',
      company: 'Stripe',
      isOnline: true,
      isRecruiter: true,
      role: 'recruiter',
      badgeStatus: 'hiring',
    },
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    lastMessage: {
      id: 'm_last_3',
      conversationId: 'conv_sarah_stripe',
      senderId: 'usr_sarah_stripe',
      receiverId: 'usr_abhishek_demo',
      text: 'Congratulations! The official offer letter is uploaded to your candidate portal.',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  conv_priya_rzp: [
    {
      id: 'msg_1',
      conversationId: 'conv_priya_rzp',
      senderId: 'usr_abhishek_demo',
      receiverId: 'usr_priya_rzp',
      text: 'Hi Priya, I applied to the Senior React Native Developer role through RoleSpire.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
    {
      id: 'msg_2',
      conversationId: 'conv_priya_rzp',
      senderId: 'usr_priya_rzp',
      receiverId: 'usr_abhishek_demo',
      text: 'Hi Abhishek! We reviewed your profile for the Senior React Native Checkout position. When are you free for a technical screen this week?',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      isRead: false,
    },
  ],
  conv_arjun_linear: [
    {
      id: 'msg_3',
      conversationId: 'conv_arjun_linear',
      senderId: 'usr_arjun_linear',
      receiverId: 'usr_abhishek_demo',
      text: 'Hey Abhishek! Make sure to highlight your experience with WebSocket synchronization in the take-home task.',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
    {
      id: 'msg_4',
      conversationId: 'conv_arjun_linear',
      senderId: 'usr_abhishek_demo',
      receiverId: 'usr_arjun_linear',
      text: 'Thanks for the referral to Linear, Arjun! Submitted the take-home project yesterday.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
  ],
  conv_sarah_stripe: [
    {
      id: 'msg_5',
      conversationId: 'conv_sarah_stripe',
      senderId: 'usr_sarah_stripe',
      receiverId: 'usr_abhishek_demo',
      text: 'Congratulations! The official offer letter is uploaded to your candidate portal.',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
  ],
};

interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  getMessages: (conversationId: string) => ChatMessage[];
  sendMessage: (conversationId: string, text: string) => void;
  startChatWithUser: (user: ChatUser, initialText?: string) => string;
  totalUnreadCount: number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('rolespire_chat_conversations');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_CONVERSATIONS; }
    }
    return INITIAL_CONVERSATIONS;
  });

  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem('rolespire_chat_messages');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_MESSAGES; }
    }
    return INITIAL_MESSAGES;
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(INITIAL_CONVERSATIONS[0].id);

  useEffect(() => {
    localStorage.setItem('rolespire_chat_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('rolespire_chat_messages', JSON.stringify(messagesMap));
  }, [messagesMap]);

  const totalUnreadCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const getMessages = (conversationId: string) => messagesMap[conversationId] || [];

  const sendMessage = (conversationId: string, text: string) => {
    if (!text.trim()) return;

    const myId = profile?.id || 'usr_abhishek_demo';
    const conv = conversations.find((c) => c.id === conversationId);
    const receiverId = conv ? conv.participant.id : 'usr_target';

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: myId,
      receiverId,
      text,
      createdAt: new Date().toISOString(),
      isRead: true,
    };

    // Update messages
    setMessagesMap((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage],
    }));

    // Update conversation last message
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessage: newMessage, updatedAt: new Date().toISOString(), unreadCount: 0 }
          : c
      )
    );

    // Realistic auto-reply simulation after 2 seconds from recruiter
    if (conv?.participant.isOnline) {
      setTimeout(() => {
        const replyMessage: ChatMessage = {
          id: `msg_reply_${Date.now()}`,
          conversationId,
          senderId: conv.participant.id,
          receiverId: myId,
          text: `Got your message! I will coordinate with the team and send over the invite shortly. 👍`,
          createdAt: new Date().toISOString(),
          isRead: true,
        };

        setMessagesMap((prev) => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), replyMessage],
        }));

        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, lastMessage: replyMessage, updatedAt: new Date().toISOString() }
              : c
          )
        );
      }, 2000);
    }
  };

  const startChatWithUser = (user: ChatUser, initialText?: string): string => {
    // Check if conversation already exists
    const existing = conversations.find((c) => c.participant.id === user.id);
    if (existing) {
      setActiveConversationId(existing.id);
      if (initialText) {
        sendMessage(existing.id, initialText);
      }
      return existing.id;
    }

    const newConvId = `conv_${user.id}_${Date.now()}`;
    const newConv: Conversation = {
      id: newConvId,
      participant: user,
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConvId);

    if (initialText) {
      sendMessage(newConvId, initialText);
    }

    return newConvId;
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        setActiveConversationId,
        getMessages,
        sendMessage,
        startChatWithUser,
        totalUnreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};

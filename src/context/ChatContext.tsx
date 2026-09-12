import React, { createContext, useContext, useEffect, useState } from 'react';
import { ChatMessage, ChatUser, Conversation } from '../types';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  getMessages: (conversationId: string) => ChatMessage[];
  sendMessage: (conversationId: string, text: string) => void;
  startChatWithUser: (user: ChatUser, initialText?: string) => string;
  markConversationRead: (conversationId: string) => void;
  totalUnreadCount: number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('rolespire_chat_conversations');
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem('rolespire_chat_messages');
    if (saved) {
      try { return JSON.parse(saved); } catch { return {}; }
    }
    return {};
  });

  const [activeConversationId, setActiveConversationId] = useState<string>('');

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
  };

  const markConversationRead = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
    );
    setMessagesMap((prev) => {
      const messages = prev[conversationId];
      if (!messages || messages.every((m) => m.isRead)) return prev;
      return {
        ...prev,
        [conversationId]: messages.map((m) => ({ ...m, isRead: true })),
      };
    });
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
        markConversationRead,
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

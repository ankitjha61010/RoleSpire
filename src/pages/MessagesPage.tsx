import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  CheckCheck, 
  ArrowLeft, 
  Phone, 
  Video, 
  MoreVertical, 
  Paperclip, 
  Smile,
  Building2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { NavPage } from '../components/layout/Navbar';
import { UserRoleBadge } from '../components/common/UserRoleBadge';

interface MessagesPageProps {
  setActivePage: (page: NavPage) => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ setActivePage }) => {
  const { conversations, activeConversationId, setActiveConversationId, getMessages, sendMessage } = useChat();
  const { profile } = useAuth();

  const [inputMessage, setInputMessage] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId) || conversations[0];
  const messages = activeConv ? getMessages(activeConv.id) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !activeConv) return;

    sendMessage(activeConv.id, inputMessage.trim());
    setInputMessage('');
  };

  const handleQuickPreset = (text: string) => {
    if (!activeConv) return;
    sendMessage(activeConv.id, text);
  };

  return (
    <div className="pb-20 max-w-5xl mx-auto">
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col md:flex-row h-[calc(100vh-10rem)] min-h-[500px]">
        {/* Left Column: Conversations List */}
        <div
          className={`w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-950/60 ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-400" />
              <h2 className="font-bold text-white text-xs">Direct Messages</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md">
              {conversations.length} Threads
            </span>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setShowMobileChat(true);
                  }}
                  className={`w-full p-3 flex items-start gap-2.5 text-left transition-all hover:bg-slate-900/80 ${
                    isActive ? 'bg-slate-900 border-l-2 border-brand-500' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white text-xs overflow-hidden">
                      {conv.participant.avatarUrl ? (
                        <img src={conv.participant.avatarUrl} alt={conv.participant.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{conv.participant.name.charAt(0)}</span>
                      )}
                    </div>
                    {conv.participant.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-white text-xs truncate">
                          {conv.participant.name}
                        </span>
                        <UserRoleBadge 
                          role={conv.participant.role} 
                          badgeStatus={conv.participant.badgeStatus} 
                          isRecruiter={conv.participant.isRecruiter}
                          size="xs"
                        />
                      </div>
                      {conv.lastMessage && (
                        <span className="text-[9px] text-slate-500 font-mono shrink-0">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-brand-300 font-medium truncate">
                      {conv.participant.company} • {conv.participant.headline}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {conv.lastMessage?.text || 'No messages yet'}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div
          className={`flex-1 flex flex-col bg-slate-900/40 ${
            showMobileChat ? 'flex' : 'hidden md:flex'
          }`}
        >
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-3 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden p-1 text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white text-xs overflow-hidden">
                      {activeConv.participant.avatarUrl ? (
                        <img src={activeConv.participant.avatarUrl} alt={activeConv.participant.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{activeConv.participant.name.charAt(0)}</span>
                      )}
                    </div>
                    {activeConv.participant.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-slate-950" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs sm:text-sm">
                        {activeConv.participant.name}
                      </span>
                      <UserRoleBadge
                        role={activeConv.participant.role}
                        badgeStatus={activeConv.participant.badgeStatus}
                        isRecruiter={activeConv.participant.isRecruiter}
                        size="xs"
                      />
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {activeConv.participant.isOnline ? (
                        <span className="text-emerald-400 font-medium">● Online now</span>
                      ) : (
                        `Last seen ${activeConv.participant.lastSeen || 'recently'}`
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActivePage('search')}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-medium hidden sm:block"
                  >
                    View Openings
                  </button>
                </div>
              </div>

              {/* Messages Bubble Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.senderId === (profile?.id || 'usr_abhishek_demo');
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'brand-gradient-btn text-white rounded-br-none shadow-sm'
                            : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.text}</p>
                      </div>

                      <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-500 font-mono px-1">
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <CheckCheck className="w-3 h-3 text-brand-400" />}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Presets */}
              <div className="px-3 py-1.5 border-t border-slate-800/60 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto text-[10px]">
                <span className="text-slate-500 shrink-0">Quick reply:</span>
                <button
                  onClick={() => handleQuickPreset('I am available for a call this Thursday at 4 PM IST.')}
                  className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap"
                >
                  📅 Available for interview
                </button>
                <button
                  onClick={() => handleQuickPreset('Here is my resume and GitHub portfolio link!')}
                  className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap"
                >
                  📄 Send Resume
                </button>
                <button
                  onClick={() => handleQuickPreset('Thanks a lot! Looking forward to connecting.')}
                  className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap"
                >
                  🙏 Thank you
                </button>
              </div>

              {/* Composer */}
              <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Message ${activeConv.participant.name.split(' ')[0]}...`}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />

                <button
                  type="submit"
                  className="brand-gradient-btn text-white p-2 rounded-xl text-xs font-bold shrink-0 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-400 text-xs">
              Select a conversation to start messaging.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

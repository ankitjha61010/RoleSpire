import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  CheckCheck, 
  ArrowLeft, 
  Sparkles, 
  Minimize2, 
  Maximize2,
  Calendar,
  MessageCircle
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { UserRoleBadge } from '../common/UserRoleBadge';

export const FloatingChatWidget: React.FC = () => {
  const { conversations, activeConversationId, setActiveConversationId, getMessages, sendMessage, totalUnreadCount } = useChat();
  const { profile } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === (selectedConvId || activeConversationId)) || conversations[0];
  const messages = activeConv ? getMessages(activeConv.id) : [];

  useEffect(() => {
    if (selectedConvId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedConvId]);

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
    <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50">
      {/* Floating Toggle Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative brand-gradient-btn text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl flex items-center gap-2.5 transition-all duration-200 hover:scale-110 active:scale-95"
          title="Direct Chat with Friends & Recruiters"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-white" />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-950 animate-bounce">
                {totalUnreadCount}
              </span>
            )}
          </div>
          <span className="text-xs font-bold hidden sm:inline">Chat</span>
        </button>
      )}

      {/* Expanded Chat Widget Window */}
      {isOpen && (
        <div className="w-[calc(100vw-32px)] sm:w-96 h-[480px] max-h-[80vh] glass-dropdown rounded-3xl shadow-2xl border border-slate-700/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 text-xs">
          {/* Header */}
          <div className="p-3.5 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {selectedConvId ? (
                <button
                  onClick={() => setSelectedConvId(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-7 h-7 rounded-xl brand-gradient-btn flex items-center justify-center text-white">
                  <MessageCircle className="w-3.5 h-3.5" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs truncate max-w-[150px]">
                    {selectedConvId && activeConv ? activeConv.participant.name : 'RoleSpire Chat'}
                  </span>
                  {selectedConvId && activeConv && (
                    <UserRoleBadge
                      role={activeConv.participant.role}
                      badgeStatus={activeConv.participant.badgeStatus}
                      isRecruiter={activeConv.participant.isRecruiter}
                      size="xs"
                    />
                  )}
                </div>
                <div className="text-[10px] text-slate-400">
                  {selectedConvId && activeConv ? (
                    <span className="text-emerald-400">● {activeConv.participant.company} • Online</span>
                  ) : (
                    'Direct chat with friends, peers & recruiters'
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                setSelectedConvId(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body: Conversations List or Chat Message Thread */}
          {!selectedConvId ? (
            /* Conversations List */
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
              <div className="p-3 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Active Direct Conversations</span>
                <span className="text-[10px] font-mono text-brand-300 bg-brand-500/10 px-1.5 py-0.2 rounded">
                  {conversations.length} Active
                </span>
              </div>

              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConvId(conv.id);
                    setActiveConversationId(conv.id);
                  }}
                  className="w-full p-3 flex items-start gap-2.5 text-left hover:bg-slate-850 transition-colors"
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
                        <span className="font-bold text-white text-xs truncate">{conv.participant.name}</span>
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
                    <div className="text-[10px] text-brand-300 truncate">
                      {conv.participant.company} • {conv.participant.headline}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {conv.lastMessage?.text || 'Tap to chat'}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            /* Active Chat Thread */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Message Bubbles */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {messages.map((msg) => {
                  const isMe = msg.senderId === (profile?.id || 'usr_abhishek_demo');
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-2.5 rounded-2xl text-[11px] leading-relaxed ${
                          isMe
                            ? 'brand-gradient-btn text-white rounded-br-none shadow-sm'
                            : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.text}</p>
                      </div>

                      <div className="flex items-center gap-1 mt-0.5 text-[8px] text-slate-500 font-mono px-1">
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <CheckCheck className="w-2.5 h-2.5 text-brand-400" />}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Presets */}
              <div className="px-2.5 py-1 bg-slate-950/60 border-t border-slate-800 flex items-center gap-1 overflow-x-auto text-[9px]">
                <button
                  onClick={() => handleQuickPreset('I am available for an interview this Thursday at 4 PM IST.')}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap"
                >
                  📅 Available for interview
                </button>
                <button
                  onClick={() => handleQuickPreset('Here is my resume and portfolio link!')}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap"
                >
                  📄 Send Resume
                </button>
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSend} className="p-2.5 border-t border-slate-800 bg-slate-950 flex items-center gap-1.5">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Reply to ${activeConv.participant.name.split(' ')[0]}...`}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl brand-gradient-btn text-white shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { messageService } from '../services/messageService';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

function Avatar({ user, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  const avatarUrl = user?.avatar ? `${BACKEND_URL}/${user.avatar.replace(/\\/g, '/')}` : null;
  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-primary-700 dark:text-primary-400">
          {user?.fullName?.[0]?.toUpperCase()}
        </span>
      )}
    </div>
  );
}

export default function MessagesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeUserId, setActiveUserId] = useState(searchParams.get('with') || null);
  const [activeUser, setActiveUser] = useState(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messageService.getConversations()
      .then((res) => setConversations(res.data.data))
      .finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    const withParam = searchParams.get('with');
    if (withParam) openConversation(withParam);
  }, []);

  const openConversation = async (userId) => {
    setActiveUserId(userId);
    setSearchParams({ with: userId });
    setLoadingMsgs(true);
    try {
      const res = await messageService.getMessages(userId);
      setMessages(res.data.data);
      // Find user info from conversations or messages
      const conv = conversations.find((c) => c._id?._id === userId || c._id === userId);
      if (conv?._id) setActiveUser(typeof conv._id === 'object' ? conv._id : null);
      // Mark conversation as read in local state
      setConversations((prev) =>
        prev.map((c) => {
          const cId = typeof c._id === 'object' ? c._id?._id : c._id;
          return cId === userId ? { ...c, unreadCount: 0 } : c;
        })
      );
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoadingMsgs(false);
    }
    inputRef.current?.focus();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && !activeUser) {
      const other = messages[0]?.sender?._id === user?._id
        ? messages[0]?.receiver
        : messages[0]?.sender;
      if (other) setActiveUser(other);
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeUserId) return;
    setSending(true);
    try {
      const res = await messageService.send({ receiverId: activeUserId, content: input.trim() });
      setMessages((prev) => [...prev, res.data.data]);
      setInput('');
      // Update conversation list
      setConversations((prev) => {
        const existing = prev.find((c) => {
          const cId = typeof c._id === 'object' ? c._id?._id : c._id;
          return cId === activeUserId;
        });
        const updated = { ...res.data.data };
        if (existing) {
          return prev.map((c) => {
            const cId = typeof c._id === 'object' ? c._id?._id : c._id;
            return cId === activeUserId ? { ...c, lastMessage: updated } : c;
          });
        }
        return prev;
      });
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('messages.title')}</h1>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex h-[600px]">
        {/* Conversations sidebar */}
        <div className={`w-full sm:w-72 shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col ${activeUserId ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('messages.conversations')}</p>
          </div>
          <div className="overflow-y-auto flex-1">
            {loadingConvs ? (
              <div className="p-8 flex justify-center"><Spinner /></div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                <div className="text-4xl mb-2">💬</div>
                <p>{t('messages.noConversations')}</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const otherUser = typeof conv._id === 'object' ? conv._id : null;
                const otherId = otherUser?._id || conv._id;
                const isActive = activeUserId === (otherId?.toString?.() || otherId);
                const lastMsg = conv.lastMessage;
                const isMine = lastMsg?.sender?._id === user?._id || lastMsg?.sender === user?._id;
                return (
                  <button
                    key={otherId}
                    onClick={() => openConversation(otherId)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isActive ? 'bg-primary-50 dark:bg-primary-900/20 border-r-2 border-primary-500' : ''}`}
                  >
                    <Avatar user={otherUser} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {otherUser?.fullName || t('messages.unknown')}
                        </p>
                        <span className="text-xs text-gray-400 shrink-0">{formatTime(lastMsg?.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {isMine && <span className="text-primary-500">{t('messages.you')}: </span>}
                        {lastMsg?.content}
                      </p>
                      {lastMsg?.job && (
                        <p className="text-xs text-primary-500 dark:text-primary-400 truncate mt-0.5">
                          {lastMsg.job.title}
                        </p>
                      )}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="shrink-0 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className={`flex-1 flex flex-col ${!activeUserId ? 'hidden sm:flex' : 'flex'}`}>
          {!activeUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <svg className="w-16 h-16 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">{t('messages.selectConversation')}</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                <button
                  className="sm:hidden mr-1 text-gray-400 hover:text-gray-600"
                  onClick={() => { setActiveUserId(null); setSearchParams({}); }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <Avatar user={activeUser} size="md" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {activeUser?.fullName || t('messages.unknown')}
                  </p>
                  {activeUser?.title && <p className="text-xs text-gray-400">{activeUser.title}</p>}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs ? (
                  <div className="flex justify-center pt-8"><Spinner /></div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                    <p>{t('messages.startConversation')}</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
                    return (
                      <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
                        {!isMine && <Avatar user={msg.sender} size="sm" />}
                        <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          {msg.job && (
                            <div className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full w-fit">
                              {msg.job.title} · {msg.job.company}
                            </div>
                          )}
                          <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${
                            isMine
                              ? 'bg-primary-600 text-white rounded-br-md'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                          }`}>
                            {msg.content}
                          </div>
                          <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                  }}
                  rows={1}
                  placeholder={t('messages.placeholder')}
                  className="flex-1 resize-none input-field py-2.5 max-h-32"
                  style={{ overflowY: 'auto' }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="btn-primary px-4 py-2.5 disabled:opacity-50 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

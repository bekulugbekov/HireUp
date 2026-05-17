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
          {user?.fullName?.[0]?.toUpperCase() || '?'}
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
  const [activePartnerId, setActivePartnerId] = useState(null);
  const [activePartner, setActivePartner] = useState(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    messageService.getConversations()
      .then((res) => {
        setConversations(res.data.data);
      })
      .catch(() => toast.error(t('common.error')))
      .finally(() => setLoadingConvs(false));
  }, []);

  // Open conversation from URL param ?with=userId
  useEffect(() => {
    const withParam = searchParams.get('with');
    if (withParam) {
      openConversation(withParam);
    }
  }, []); // runs once on mount

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Derive activePartner from messages if not set from conversations
  useEffect(() => {
    if (messages.length > 0 && !activePartner) {
      const firstMsg = messages[0];
      const senderId = firstMsg.sender?._id || firstMsg.sender;
      const other = senderId === user?._id ? firstMsg.receiver : firstMsg.sender;
      if (other && typeof other === 'object') setActivePartner(other);
    }
  }, [messages, user]);

  const openConversation = async (partnerId) => {
    const partnerIdStr = partnerId?.toString();
    setActivePartnerId(partnerIdStr);
    setSearchParams({ with: partnerIdStr });
    setLoadingMsgs(true);
    setMessages([]);

    // Try to get partner info from already-loaded conversations
    const conv = conversations.find((c) => c.partnerId === partnerIdStr);
    if (conv?.partner) {
      setActivePartner(conv.partner);
    }

    try {
      const res = await messageService.getMessages(partnerIdStr);
      setMessages(res.data.data);

      // Mark as read in local state
      setConversations((prev) =>
        prev.map((c) => c.partnerId === partnerIdStr ? { ...c, unreadCount: 0 } : c)
      );
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoadingMsgs(false);
      inputRef.current?.focus();
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activePartnerId) return;
    setSending(true);
    try {
      const res = await messageService.send({ receiverId: activePartnerId, content: input.trim() });
      const newMsg = res.data.data;
      setMessages((prev) => [...prev, newMsg]);
      setInput('');

      // Update conversation list last message
      setConversations((prev) => {
        const exists = prev.some((c) => c.partnerId === activePartnerId);
        if (exists) {
          return prev.map((c) =>
            c.partnerId === activePartnerId
              ? { ...c, lastMessage: newMsg }
              : c
          );
        }
        // New conversation not yet in list — add it
        return [
          {
            partnerId: activePartnerId,
            partner: activePartner,
            unreadCount: 0,
            lastMessage: newMsg,
          },
          ...prev,
        ];
      });
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString();
  };

  const myId = user?._id?.toString();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('messages.title')}</h1>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex h-[600px]">

        {/* Sidebar — conversations */}
        <div className={`w-full sm:w-72 shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col ${activePartnerId ? 'hidden sm:flex' : 'flex'}`}>
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
                const isActive = activePartnerId === conv.partnerId;
                const lastMsg = conv.lastMessage;
                const lastSenderId = lastMsg?.sender?._id?.toString() || lastMsg?.sender?.toString();
                const isMine = lastSenderId === myId;

                return (
                  <button
                    key={conv.partnerId}
                    onClick={() => openConversation(conv.partnerId)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      isActive ? 'bg-primary-50 dark:bg-primary-900/20 border-r-2 border-primary-500' : ''
                    }`}
                  >
                    <Avatar user={conv.partner} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {conv.partner?.fullName || t('messages.unknown')}
                        </p>
                        <span className="text-xs text-gray-400 shrink-0">{formatTime(lastMsg?.createdAt)}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 && !isActive ? 'font-semibold text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isMine && <span className="text-primary-500">{t('messages.you')}: </span>}
                        {lastMsg?.content}
                      </p>
                      {lastMsg?.job && (
                        <p className="text-xs text-primary-500 dark:text-primary-400 truncate mt-0.5">
                          {lastMsg.job.title}
                        </p>
                      )}
                    </div>
                    {conv.unreadCount > 0 && !isActive && (
                      <span className="shrink-0 w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className={`flex-1 flex flex-col min-w-0 ${!activePartnerId ? 'hidden sm:flex' : 'flex'}`}>
          {!activePartnerId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <svg className="w-14 h-14 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">{t('messages.selectConversation')}</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 shrink-0">
                <button
                  className="sm:hidden p-1 text-gray-400 hover:text-gray-600"
                  onClick={() => { setActivePartnerId(null); setSearchParams({}); }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <Avatar user={activePartner} size="md" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {activePartner?.fullName || t('messages.unknown')}
                  </p>
                  {activePartner?.title && (
                    <p className="text-xs text-gray-400">{activePartner.title}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs ? (
                  <div className="flex justify-center pt-10"><Spinner /></div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-1">
                    <p>{t('messages.startConversation')}</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const senderId = msg.sender?._id?.toString() || msg.sender?.toString();
                    const isMine = senderId === myId;
                    return (
                      <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2 items-end`}>
                        {!isMine && <Avatar user={msg.sender} size="sm" />}
                        <div className={`max-w-[70%] flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                          {msg.job && (
                            <div className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-full w-fit">
                              {msg.job.title} · {msg.job.company}
                            </div>
                          )}
                          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMine
                              ? 'bg-primary-600 text-white rounded-br-md'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                          }`}>
                            {msg.content}
                          </div>
                          <span className="text-[11px] text-gray-400">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-end gap-3 shrink-0">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  rows={1}
                  placeholder={t('messages.placeholder')}
                  className="flex-1 resize-none input-field py-2.5 max-h-32"
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

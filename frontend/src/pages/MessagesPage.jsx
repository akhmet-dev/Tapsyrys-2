import { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import useTranslation from '../hooks/useTranslation';
import useSSE from '../hooks/useSSE';
import { getErrorMessage } from '../services/api';
import {
  fetchApplicantConversations,
  markMessagesAsRead,
  sendMessageByApplication,
} from '../services/messageService';
import {
  formatLocalizedDateTime,
  getLocalizedValue,
} from '../utils/localization';

const STATUS_CLASS = {
  күтілуде: 'pending',
  қабылданды: 'accepted',
  қабылданбады: 'rejected',
};

const MessagesPage = () => {
  const { t, language } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');
  const threadListRef = useRef(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const loadConversations = async (preferredId = '') => {
    setIsLoading(true);
    setError('');

    try {
      const nextConversations = await fetchApplicantConversations();
      setConversations(nextConversations);

      const nextSelectedId =
        preferredId ||
        selectedConversationId ||
        nextConversations.find((conversation) => conversation.unreadCount > 0)?._id ||
        nextConversations[0]?._id ||
        '';

      setSelectedConversationId(nextSelectedId);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    setMessageText('');
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversation || selectedConversation.unreadCount === 0) {
      return;
    }

    let cancelled = false;

    const syncReadState = async () => {
      try {
        await markMessagesAsRead(selectedConversation._id);

        if (cancelled) {
          return;
        }

        setConversations((prev) =>
          prev.map((conversation) => {
            if (conversation._id !== selectedConversation._id) {
              return conversation;
            }

            const nextMessages = conversation.messages.map((message) =>
              message.senderRole === 'admin' ? { ...message, isRead: true } : message
            );

            return {
              ...conversation,
              messages: nextMessages,
              unreadCount: 0,
            };
          })
        );
      } catch {
        // Оқылу белгісінің қатесін интерфейсте бөлек көрсетпейміз
      }
    };

    syncReadState();

    return () => {
      cancelled = true;
    };
  }, [selectedConversation]);

  useSSE(
    (payload) => {
      if (payload.type === 'NEW_MESSAGE' || payload.type === 'MESSAGES_READ') {
        loadConversations(payload.applicationId);
      }
    },
    true
  );

  const handleSelectConversation = (conversationId) => {
    setSelectedConversationId(conversationId);
  };

  useEffect(() => {
    if (!threadListRef.current) {
      return;
    }

    threadListRef.current.scrollTop = threadListRef.current.scrollHeight;
  }, [selectedConversationId, selectedConversation?.messages.length]);

  const totalUnread = conversations.reduce(
    (total, conversation) => total + conversation.unreadCount,
    0
  );

  const getConversationPreview = (conversation) =>
    conversation.lastMessage?.text || t('messages.emptyMessages');

  const handleSendMessage = async () => {
    const trimmedText = messageText.trim();

    if (!selectedConversation || !trimmedText) {
      return;
    }

    setIsSending(true);
    setError('');

    try {
      const response = await sendMessageByApplication(selectedConversation._id, trimmedText);
      const nextMessage = response.data;

      setConversations((prev) =>
        prev
          .map((conversation) => {
            if (conversation._id !== selectedConversation._id) {
              return conversation;
            }

            const nextMessages = [...conversation.messages, nextMessage];

            return {
              ...conversation,
              messages: nextMessages,
              lastMessage: nextMessage,
            };
          })
          .sort((left, right) => {
            const leftDate = new Date(left.lastMessage?.createdAt || left.createdAt || 0).getTime();
            const rightDate = new Date(right.lastMessage?.createdAt || right.createdAt || 0).getTime();
            return rightDate - leftDate;
          })
      );

      setMessageText('');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="messages-hero">
            <div className="messages-hero-copy">
              <span className="messages-hero-kicker">{t('messages.kicker')}</span>
              <h1 className="messages-hero-title">{t('nav.messages')}</h1>
              <p className="messages-hero-subtitle">{t('messages.pageSubtitle')}</p>
            </div>
            <div className="messages-hero-stats">
              <div className="messages-stat-chip">
                <span className="messages-stat-value">{conversations.length}</span>
                <span className="messages-stat-label">{t('messages.applicationsLabel')}</span>
              </div>
              <div className={`messages-stat-chip ${totalUnread > 0 ? 'is-unread' : ''}`}>
                <span className="messages-stat-value">{totalUnread}</span>
                <span className="messages-stat-label">{t('messages.newMessage')}</span>
              </div>
            </div>
          </div>

          {isLoading && <LoadingSpinner text={t('common.loading')} />}

          {!isLoading && error && (
            <ErrorMessage message={error} onDismiss={() => loadConversations(selectedConversationId)} />
          )}

          {!isLoading && !error && (
            conversations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-illustration">💬</div>
                <h3>{t('messages.emptyConversations')}</h3>
                <p>{t('messages.emptyConversationsDesc')}</p>
              </div>
            ) : (
              <div className="messages-layout">
                <aside className="messages-sidebar">
                  <div className="messages-sidebar-head">
                    <div>
                      <h2>{t('messages.conversationsTitle')}</h2>
                      <p>{t('messages.conversationsSubtitle')}</p>
                    </div>
                  </div>

                  <div className="messages-sidebar-list">
                    {conversations.map((conversation) => (
                      <button
                        key={conversation._id}
                        type="button"
                        onClick={() => handleSelectConversation(conversation._id)}
                        className={`conversation-card ${selectedConversationId === conversation._id ? 'active' : ''} ${conversation.unreadCount > 0 ? 'unread' : ''}`}
                      >
                        <div className="conversation-card-top">
                          <div className="conversation-card-title-wrap">
                            <span className="conversation-avatar">
                              {getLocalizedValue(language, 'specialities', conversation.speciality)
                                .slice(0, 1)
                                .toUpperCase()}
                            </span>
                            <div>
                              <strong>{getLocalizedValue(language, 'specialities', conversation.speciality)}</strong>
                              <div className="conversation-card-sub">
                                {getLocalizedValue(language, 'faculties', conversation.faculty)}
                              </div>
                            </div>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <span className="conversation-unread-badge">{conversation.unreadCount}</span>
                          )}
                        </div>
                        <div className="conversation-card-preview">
                          {getConversationPreview(conversation)}
                        </div>
                        <div className="conversation-card-foot">
                          <span className={`status-badge ${STATUS_CLASS[conversation.status] || 'pending'}`}>
                            {getLocalizedValue(language, 'statuses', conversation.status)}
                          </span>
                          <span>
                            {conversation.lastMessage?.createdAt
                              ? formatLocalizedDateTime(conversation.lastMessage.createdAt, language)
                              : formatLocalizedDateTime(conversation.createdAt, language)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </aside>

                <section className="messages-thread-panel">
                  {selectedConversation ? (
                    <>
                      <header className="messages-thread-header">
                        <div className="messages-thread-title-wrap">
                          <span className="messages-thread-avatar">
                            {getLocalizedValue(language, 'specialities', selectedConversation.speciality)
                              .slice(0, 1)
                              .toUpperCase()}
                          </span>
                          <h2>{getLocalizedValue(language, 'specialities', selectedConversation.speciality)}</h2>
                          <div>
                            <p>{getLocalizedValue(language, 'faculties', selectedConversation.faculty)}</p>
                            <span className="messages-thread-meta">
                              {selectedConversation.messages.length} {t('messages.messageCountLabel')}
                            </span>
                          </div>
                        </div>
                        <div className="messages-thread-side">
                          <span className={`status-badge ${STATUS_CLASS[selectedConversation.status] || 'pending'}`}>
                            {getLocalizedValue(language, 'statuses', selectedConversation.status)}
                          </span>
                          <span className="messages-thread-last-time">
                            {t('messages.lastUpdate')}:{' '}
                            {formatLocalizedDateTime(
                              selectedConversation.lastMessage?.createdAt || selectedConversation.createdAt,
                              language
                            )}
                          </span>
                        </div>
                      </header>

                      <div className="messages-thread-list" ref={threadListRef}>
                        {selectedConversation.messages.length === 0 ? (
                          <div className="empty-state compact">
                            <h3>{t('messages.emptyMessages')}</h3>
                          </div>
                        ) : (
                          selectedConversation.messages.map((message) => (
                            <article
                              key={message.id}
                              className={[
                                'thread-message',
                                message.senderRole === 'admin'
                                  ? 'thread-message--incoming'
                                  : 'thread-message--outgoing',
                                !message.isRead && message.senderRole === 'admin' ? 'unread' : '',
                              ].join(' ')}
                            >
                              <div className="thread-message-head">
                                <div className="thread-message-author">
                                  <span className="thread-message-author-badge">
                                    {message.senderRole === 'admin'
                                      ? t('messages.adminLabel')
                                      : t('messages.applicantLabel')}
                                  </span>
                                  <strong>{message.senderName}</strong>
                                </div>
                                <span>{formatLocalizedDateTime(message.createdAt, language)}</span>
                              </div>
                              <p className="thread-message-body">{message.text}</p>
                              <div className="thread-message-foot">
                                <span>
                                  {message.senderRole === 'admin' && message.isRead
                                    ? t('messages.read')
                                    : message.senderRole === 'admin'
                                      ? t('messages.unread')
                                      : t('messages.sent')}
                                </span>
                              </div>
                            </article>
                          ))
                        )}
                      </div>

                      <div className="messages-composer">
                        <div className="messages-composer-top">
                          <label htmlFor="applicant-message">{t('messages.replyLabel')}</label>
                          <span>{t('messages.replyHint')}</span>
                        </div>
                        <div className="messages-composer-row">
                          <textarea
                            id="applicant-message"
                            className="messages-composer-textarea"
                            value={messageText}
                            onChange={(event) => setMessageText(event.target.value)}
                            placeholder={t('messages.replyPlaceholder')}
                            rows={3}
                          />
                          <button
                            type="button"
                            className="btn btn-primary messages-composer-button"
                            onClick={handleSendMessage}
                            disabled={isSending || !messageText.trim()}
                          >
                            {isSending ? t('messages.sending') : t('messages.send')}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="empty-state compact">
                      <h3>{t('messages.selectConversation')}</h3>
                      <p>{t('messages.selectConversationDesc')}</p>
                    </div>
                  )}
                </section>
              </div>
            )
          )}
        </div>
      </main>
    </>
  );
};

export default MessagesPage;

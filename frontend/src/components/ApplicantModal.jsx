import { useEffect, useState } from 'react';
import useTranslation from '../hooks/useTranslation';
import { getErrorMessage } from '../services/api';
import {
  fetchAdminApplicationFull,
  getPublicFileUrl,
} from '../services/applicationService';
import {
  fetchMessagesByApplication,
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

const formatFileSize = (bytes) => {
  if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes <= 0) {
    return '—';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageDocument = (document = {}) => {
  const fileName = document.originalName || document.fileName || document.url || '';
  return document.mimeType?.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(fileName);
};

const ApplicantModal = ({ applicationId, isOpen, onClose, reloadKey = 0 }) => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [details, setDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !applicationId) {
      return;
    }

    let cancelled = false;

    const loadDetails = async () => {
      setIsLoading(true);
      setError('');
      setActiveTab('profile');
      setMessageText('');

      try {
        const [fullResponse, messagesResponse] = await Promise.all([
          fetchAdminApplicationFull(applicationId),
          fetchMessagesByApplication(applicationId),
        ]);

        if (cancelled) {
          return;
        }

        setDetails(fullResponse.data);
        setMessages(messagesResponse.data || fullResponse.data?.messages || []);
      } catch (requestError) {
        if (!cancelled) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [applicationId, isOpen, reloadKey]);

  if (!isOpen) {
    return null;
  }

  const user = details?.user;
  const application = details?.application;
  const documents = details?.documents || [];
  const history = details?.history || [];

  const handleSendMessage = async () => {
    const trimmedText = messageText.trim();

    if (!trimmedText) {
      return;
    }

    setIsSending(true);
    setError('');

    try {
      const response = await sendMessageByApplication(applicationId, trimmedText);
      setMessages((prev) => [...prev, response.data]);
      setMessageText('');
      setActiveTab('messages');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSending(false);
    }
  };

  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return t('messages.notSpecified');
    }

    return value;
  };

  const renderProfileTab = () => (
    <div className="profile-modal-content">
      <section className="profile-modal-section">
        <div className="profile-modal-section-head">
          <h3>{t('messages.sections.personal')}</h3>
        </div>
        <div className="profile-info-grid">
          <div className="profile-info-card">
            <span className="profile-info-label">{t('messages.fields.fullName')}</span>
            <strong>{renderValue(user?.fullName)}</strong>
          </div>
          <div className="profile-info-card">
            <span className="profile-info-label">Email</span>
            <strong>{renderValue(user?.email)}</strong>
          </div>
          <div className="profile-info-card">
            <span className="profile-info-label">{t('messages.fields.phone')}</span>
            <strong>{renderValue(user?.phone)}</strong>
          </div>
          <div className="profile-info-card">
            <span className="profile-info-label">{t('messages.fields.city')}</span>
            <strong>{renderValue(user?.city)}</strong>
          </div>
        </div>
      </section>

      <section className="profile-modal-section">
        <div className="profile-modal-section-head">
          <h3>{t('messages.sections.application')}</h3>
        </div>
        <div className="profile-info-grid">
          <div className="profile-info-card">
            <span className="profile-info-label">{t('messages.fields.faculty')}</span>
            <strong>
              {application
                ? getLocalizedValue(language, 'faculties', application.faculty)
                : t('messages.notSpecified')}
            </strong>
          </div>
          <div className="profile-info-card">
            <span className="profile-info-label">{t('messages.fields.speciality')}</span>
            <strong>
              {application
                ? getLocalizedValue(language, 'specialities', application.speciality)
                : t('messages.notSpecified')}
            </strong>
          </div>
          <div className="profile-info-card">
            <span className="profile-info-label">{t('messages.fields.entScore')}</span>
            <strong>{renderValue(application?.entExamScore)}</strong>
          </div>
          <div className="profile-info-card">
            <span className="profile-info-label">{t('messages.fields.status')}</span>
            <span className={`status-badge ${STATUS_CLASS[application?.status] || 'pending'}`}>
              {application ? getLocalizedValue(language, 'statuses', application.status) : t('messages.notSpecified')}
            </span>
          </div>
          <div className="profile-info-card">
            <span className="profile-info-label">{t('messages.fields.registeredAt')}</span>
            <strong>{user?.createdAt ? formatLocalizedDateTime(user.createdAt, language) : t('messages.notSpecified')}</strong>
          </div>
          <div className="profile-info-card">
            <span className="profile-info-label">{t('messages.fields.appliedAt')}</span>
            <strong>{application?.createdAt ? formatLocalizedDateTime(application.createdAt, language) : t('messages.notSpecified')}</strong>
          </div>
        </div>
      </section>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="profile-modal-content">
      {documents.length === 0 ? (
        <div className="modal-warning-box">⚠️ {t('messages.noDocuments')}</div>
      ) : (
        <div className="modal-documents-list">
          {documents.map((document) => {
            const openUrl = getPublicFileUrl(document.openUrl || document.url);
            const downloadUrl = getPublicFileUrl(document.downloadUrl || document.url);

            return (
              <article key={document.id} className="modal-document-card">
                <div className="modal-document-preview">
                  {isImageDocument(document) ? (
                    <a href={openUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={openUrl}
                        alt={document.name}
                        className="modal-document-image"
                      />
                    </a>
                  ) : (
                    <div className="modal-document-filetype">PDF</div>
                  )}
                </div>
                <div className="modal-document-main">
                  <div className="modal-document-meta">
                    <span className="profile-info-label">{t('messages.fields.documentType')}</span>
                    <strong>{document.name}</strong>
                  </div>
                  <div className="modal-document-meta">
                    <span className="profile-info-label">{t('messages.fields.fileSize')}</span>
                    <strong>{formatFileSize(document.size)}</strong>
                  </div>
                  <div className="modal-document-meta">
                    <span className="profile-info-label">{t('messages.fields.uploadedAt')}</span>
                    <strong>{document.uploadedAt ? formatLocalizedDateTime(document.uploadedAt, language) : t('messages.notSpecified')}</strong>
                  </div>
                </div>
                <div className="modal-document-actions">
                  <a
                    href={openUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    {t('common.open')}
                  </a>
                  <a
                    href={downloadUrl}
                    className="btn btn-primary btn-sm"
                    download={document.originalName || document.name}
                  >
                    {t('common.download')}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="profile-modal-content">
      {history.length === 0 ? (
        <div className="empty-state compact">
          <h3>{t('messages.emptyHistory')}</h3>
        </div>
      ) : (
        <div className="status-timeline">
          {history.map((item) => (
            <article key={item.id} className="status-timeline-item">
              <div className="status-timeline-dot" />
              <div className="status-timeline-card">
                <div className="status-timeline-top">
                  <strong>{formatLocalizedDateTime(item.changedAt, language)}</strong>
                  <span className="status-timeline-author">
                    {item.changedBy?.fullName || t('messages.system')}
                  </span>
                </div>
                <div className="status-timeline-transition">
                  <span>{item.oldStatus ? getLocalizedValue(language, 'statuses', item.oldStatus) : t('messages.initialStatus')}</span>
                  <span>→</span>
                  <span>{getLocalizedValue(language, 'statuses', item.newStatus)}</span>
                </div>
                {item.note && (
                  <p className="status-timeline-note">{item.note}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const renderMessagesTab = () => (
    <div className="profile-modal-content">
      <div className="modal-message-composer">
        <label className="form-label" htmlFor="admin-message">
          {t('messages.writeMessage')}
        </label>
        <textarea
          id="admin-message"
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          placeholder={t('messages.writePlaceholder')}
          className="form-input modal-message-textarea"
          rows={4}
        />
        <div className="modal-message-toolbar">
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={isSending || !messageText.trim()}
            className="btn btn-primary"
          >
            {isSending ? <><span className="spinner-sm" /> {t('messages.sending')}</> : t('messages.send')}
          </button>
        </div>
      </div>

      <div className="modal-message-thread">
        {messages.length === 0 ? (
          <div className="empty-state compact">
            <h3>{t('messages.emptyMessages')}</h3>
          </div>
        ) : (
          messages.map((message) => (
            <article key={message.id} className="modal-message-item">
              <div className="modal-message-head">
                <strong>{message.senderName}</strong>
                <span>{formatLocalizedDateTime(message.createdAt, language)}</span>
              </div>
              <p>{message.text}</p>
              <div className="modal-message-foot">
                {message.isRead && (
                  <span className="modal-message-read">{t('messages.read')}</span>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="applicant-drawer" onClick={(event) => event.stopPropagation()}>
        <header className="applicant-drawer-header">
          <div>
            <p className="profile-info-label">{t('messages.fullProfile')}</p>
            <h2>{user?.fullName || t('messages.fullProfile')}</h2>
          </div>
          <button type="button" className="drawer-close-btn" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </header>

        <nav className="drawer-tabs">
          <button
            type="button"
            className={`drawer-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            {t('messages.tabs.profile')}
          </button>
          <button
            type="button"
            className={`drawer-tab ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            {t('messages.tabs.documents')}
          </button>
          <button
            type="button"
            className={`drawer-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            {t('messages.tabs.history')}
          </button>
          <button
            type="button"
            className={`drawer-tab ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            {t('messages.tabs.messages')}
          </button>
        </nav>

        {error && (
          <div className="alert alert-error" style={{ margin: '0 var(--sp-5) var(--sp-4)' }}>
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">{error}</span>
          </div>
        )}

        <div className="applicant-drawer-body">
          {isLoading ? (
            <div className="drawer-loading">
              <div className="loading-spinner-lg" />
              <p>{t('common.loading')}</p>
            </div>
          ) : (
            <>
              {activeTab === 'profile' && renderProfileTab()}
              {activeTab === 'documents' && renderDocumentsTab()}
              {activeTab === 'history' && renderHistoryTab()}
              {activeTab === 'messages' && renderMessagesTab()}
            </>
          )}
        </div>
      </aside>
    </div>
  );
};

export default ApplicantModal;

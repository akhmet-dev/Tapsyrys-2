import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useTranslation from '../hooks/useTranslation';
import { downloadApplicationPDF, getPublicFileUrl } from '../services/applicationService';
import {
  STATUS_OPTIONS,
  formatLocalizedDate,
  getLocalizedValue,
} from '../utils/localization';

const STATUS_CLASS = {
  'күтілуде':     'pending',
  'қабылданды':   'accepted',
  'қабылданбады': 'rejected',
};

const getFacultyIcon = (faculty) => {
  if (!faculty) return '🏛️';
  const f = faculty.toLowerCase();
  if (f.includes('ақпарат') || f.includes('технолог')) return '💻';
  if (f.includes('экономик') || f.includes('бизнес'))  return '💼';
  if (f.includes('заң') || f.includes('құқық'))        return '⚖️';
  if (f.includes('медицина') || f.includes('дәрі'))    return '🏥';
  if (f.includes('педагог') || f.includes('білім'))    return '📚';
  if (f.includes('инженер'))                           return '⚙️';
  if (f.includes('гуманитар'))                         return '🎨';
  if (f.includes('жаратылыс'))                         return '🔬';
  return '🏛️';
};

const isImageDocument = (document = {}) => {
  const fileName = document.originalName || document.fileName || document.url || '';
  return document.mimeType?.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(fileName);
};

const ApplicationCard = ({ application, onDelete, onStatusChange }) => {
  const { isAdmin } = useAuth();
  const { t, language } = useTranslation();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting]                 = useState(false);
  const [deleteError, setDeleteError]               = useState('');

  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus]     = useState(application.status);
  const [adminNote, setAdminNote]               = useState(application.adminNote || '');
  const [isSavingStatus, setIsSavingStatus]     = useState(false);
  const [statusError, setStatusError]           = useState('');

  const [showHistory, setShowHistory] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setDeleteError('');
    const result = await onDelete(application._id);
    if (!result.success) {
      setDeleteError(result.message);
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  const handleStatusSave = async () => {
    setIsSavingStatus(true);
    setStatusError('');
    const result = await onStatusChange(application._id, selectedStatus, adminNote);
    if (result.success) {
      setIsChangingStatus(false);
    } else {
      setStatusError(result.message);
    }
    setIsSavingStatus(false);
  };

  const handleDownloadPDF = async () => {
    setIsPdfLoading(true);
    try {
      await downloadApplicationPDF(application._id);
    } catch {
      // қате болса үнсіз өткіземіз
    } finally {
      setIsPdfLoading(false);
    }
  };

  const canDelete = isAdmin || application.status === 'күтілуде';
  const statusClass = STATUS_CLASS[application.status] || 'pending';
  const facultyIcon = getFacultyIcon(application.faculty);
  const history = application.statusHistory || [];

  return (
    <div className={`app-card app-card--${statusClass}`}>

      {/* ── Main row ── */}
      <div className={`app-card-row ${isAdmin ? 'admin' : ''}`}>

        {/* Col 1 */}
        {isAdmin ? (
          <div>
            {application.applicant ? (
              <>
                <div className="app-card-applicant-name">{application.applicant.fullName}</div>
                <div className="app-card-applicant-email">{application.applicant.email}</div>
                {application.applicant.city && (
                  <div className="app-card-applicant-city">📍 {application.applicant.city}</div>
                )}
              </>
            ) : (
              <span className="app-card-applicant-name">—</span>
            )}
          </div>
        ) : (
          <div className="app-card-head">
            <div className="app-card-icon">{facultyIcon}</div>
            <div className="app-card-info">
              <div className="app-card-title">
                {getLocalizedValue(language, 'specialities', application.speciality)}
              </div>
              {application.priority && application.priority > 1 && (
                <div className="app-card-priority">
                  {t('card.priority')} #{application.priority}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Col 2 */}
        {isAdmin ? (
          <div className="app-card-info" style={{ minWidth: 0 }}>
            <div className="app-card-title" style={{ fontSize: '0.82rem' }}>
              {getLocalizedValue(language, 'specialities', application.speciality)}
            </div>
            <div className="app-card-faculty">
              {getLocalizedValue(language, 'faculties', application.faculty)}
            </div>
          </div>
        ) : (
          <div className="app-card-faculty-cell">
            {getLocalizedValue(language, 'faculties', application.faculty)}
          </div>
        )}

        {/* Col 3 */}
        {isAdmin ? (
          <div className="td-ent" style={{ textAlign: 'center' }}>
            {application.entExamScore}
          </div>
        ) : (
          <div className="app-card-ent-cell">
            <div className="app-ent">{application.entExamScore}</div>
            <div className="app-ent-max">/140</div>
          </div>
        )}

        {/* Col 4 */}
        {isAdmin ? (
          <div className="app-card-status-cell">
            <span className={`status-badge ${statusClass}`}>
              {getLocalizedValue(language, 'statuses', application.status)}
            </span>
          </div>
        ) : (
          <div className="app-card-status-cell">
            <span className={`status-badge ${statusClass}`}>
              {getLocalizedValue(language, 'statuses', application.status)}
            </span>
          </div>
        )}

        {/* Col 5 */}
        {isAdmin ? (
          <div className="td-docs">{application.documents?.length || 0}</div>
        ) : (
          <div className="app-date">
            {formatLocalizedDate(application.createdAt, language)}
          </div>
        )}

        {/* Col 6: Actions */}
        <div className={`app-card-actions ${isAdmin ? 'admin' : 'applicant'}`}>
          {/* PDF жүктеу */}
          {!isConfirmingDelete && !isChangingStatus && (
            <button
              onClick={handleDownloadPDF}
              disabled={isPdfLoading}
              className="btn btn-ghost btn-sm app-card-icon-btn"
              title={t('card.downloadPdf')}
            >
              {isPdfLoading
                ? <span className="spinner-sm" />
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>}
            </button>
          )}

          {/* Абитуриент: edit (тек күтілуде) */}
          {!isAdmin && application.status === 'күтілуде' && !isConfirmingDelete && (
            <Link
              to={`/applications/edit/${application._id}`}
              className="btn btn-ghost btn-sm app-card-text-btn"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {t('card.edit')}
            </Link>
          )}

          {/* Статус тарихы батырмасы */}
          {history.length > 0 && !isConfirmingDelete && !isChangingStatus && (
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="btn btn-ghost btn-sm app-card-icon-btn"
              title={t('card.statusHistory')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </button>
          )}

          {application.documents?.length > 0 && !isConfirmingDelete && !isChangingStatus && (
            <button
              onClick={() => setShowDocuments((value) => !value)}
              className="btn btn-ghost btn-sm app-card-text-btn"
            >
              {t('card.documents')}
            </button>
          )}

          {/* Admin: status change */}
          {isAdmin && !isChangingStatus && !isConfirmingDelete && (
            <button
              onClick={() => setIsChangingStatus(true)}
              className="btn btn-ghost btn-sm app-card-text-btn"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              {t('card.statusChange')}
            </button>
          )}

          {/* Delete */}
          {canDelete && !isConfirmingDelete && !isChangingStatus && (
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="btn btn-sm app-card-delete-btn app-card-icon-btn"
              title={t('card.delete')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
              </svg>
            </button>
          )}

          {/* Delete confirm */}
          {isConfirmingDelete && (
            <div className="app-card-confirm-actions">
              <button onClick={handleDeleteConfirm} disabled={isDeleting} className="btn btn-danger btn-sm">
                {isDeleting ? <><span className="spinner-sm" /> {t('card.deleting')}</> : t('card.confirm')}
              </button>
              <button onClick={() => setIsConfirmingDelete(false)} className="btn btn-secondary btn-sm">
                {t('card.cancelConfirm')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Status history accordion ── */}
      {showHistory && history.length > 0 && (
        <div className="app-card-history">
          <div className="app-card-history-title">
            🕐 {t('card.statusHistory')}
          </div>
          <div className="app-card-history-list">
            {history.map((h, i) => (
              <div key={i} className="app-card-history-item">
                <span className={`status-badge ${STATUS_CLASS[h.status] || 'pending'}`} style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                  {getLocalizedValue(language, 'statuses', h.status)}
                </span>
                <span className="app-card-history-date">
                  {formatLocalizedDate(h.changedAt, language)}
                </span>
                {h.adminNote && (
                  <span className="app-card-history-note">— {h.adminNote}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showDocuments && application.documents?.length > 0 && (
        <div className="app-card-documents">
          <div className="app-card-history-title">
            📎 {t('card.documents')}
          </div>
          <div className="app-card-doc-list">
            {application.documents.map((document, index) => {
              const fileUrl = getPublicFileUrl(document.url);

              return (
                <div key={document._id || `${document.name}-${index}`} className="app-card-doc-item">
                  <div className="app-card-doc-preview">
                    {isImageDocument(document) ? (
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={fileUrl}
                          alt={document.name}
                          className="app-card-doc-image"
                        />
                      </a>
                    ) : (
                      <div className="app-card-doc-placeholder">PDF</div>
                    )}
                  </div>
                  <div className="app-card-doc-meta">
                    <strong>{document.name}</strong>
                    <span>{document.originalName || document.fileName || document.name}</span>
                  </div>
                  <div className="app-card-doc-actions">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="doc-item-link"
                    >
                      {t('common.open')}
                    </a>
                    <a
                      href={fileUrl}
                      download={document.originalName || document.name}
                      className="doc-item-link"
                    >
                      {t('common.download')}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Admin note ── */}
      {application.adminNote && (
        <div className="app-card-note">
          <strong>📌 {t('card.note')}:</strong> {application.adminNote}
        </div>
      )}

      {/* ── Errors ── */}
      {(deleteError || statusError) && (
        <p className="app-card-error">⚠️ {deleteError || statusError}</p>
      )}

      {/* ── Status change panel (admin) ── */}
      {isAdmin && isChangingStatus && (
        <div className="app-card-status-panel">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.85rem' }}
          >
            {STATUS_OPTIONS.map(({ value }) => (
              <option key={value} value={value}>
                {getLocalizedValue(language, 'statuses', value)}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder={t('card.notePlaceholder')}
            className="form-input"
            style={{ fontSize: '0.85rem' }}
            maxLength={500}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={handleStatusSave} disabled={isSavingStatus} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
              {isSavingStatus ? <><span className="spinner-sm" /> {t('card.saving')}</> : t('card.save')}
            </button>
            <button onClick={() => setIsChangingStatus(false)} className="btn btn-secondary btn-sm">
              {t('card.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationCard;

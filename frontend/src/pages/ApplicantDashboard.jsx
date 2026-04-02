import { useState, useCallback, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useTranslation from '../hooks/useTranslation';
import useApplications from '../hooks/useApplications';
import useSSE from '../hooks/useSSE';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ApplicationCard from '../components/ApplicationCard';
import { getLocalizedValue } from '../utils/localization';

const ApplicantDashboard = () => {
  const { currentUser } = useAuth();
  const { t, language } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    applications, isLoading, error,
    loadApplications, removeApplication, changeApplicationStatus,
  } = useApplications();

  const [statusFilter, setStatusFilter] = useState('барлығы');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!location.state?.successMessage) {
      return;
    }

    setActionMessage({
      type: 'success',
      text: location.state.successMessage,
    });

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  // ── Нақты уақыт SSE байланысы ──
  const handleSSEMessage = useCallback((payload) => {
    if (payload.type === 'STATUS_CHANGE') {
      // Статус өзгергенде деректерді серверден жаңарту
      loadApplications();
      setActionMessage({
        type: 'success',
        text: t('sse.statusChanged').replace('{{status}}', payload.status),
      });
      setTimeout(() => setActionMessage({ type: '', text: '' }), 5000);
    }

    if (payload.type === 'NEW_MESSAGE') {
      setActionMessage({
        type: 'success',
        text: t('messages.newMessage'),
      });
      setTimeout(() => setActionMessage({ type: '', text: '' }), 5000);
    }
  }, [loadApplications, t]);

  useSSE(handleSSEMessage, true);

  const stats = {
    total:    applications.length,
    pending:  applications.filter((a) => a.status === 'күтілуде').length,
    accepted: applications.filter((a) => a.status === 'қабылданды').length,
    rejected: applications.filter((a) => a.status === 'қабылданбады').length,
  };

  const STAT_CONFIG = [
    { key: 'total',    label: t('dashboard.stats.total'),    colorClass: 'blue'  },
    { key: 'pending',  label: t('dashboard.stats.pending'),  colorClass: 'amber' },
    { key: 'accepted', label: t('dashboard.stats.accepted'), colorClass: 'green' },
    { key: 'rejected', label: t('dashboard.stats.rejected'), colorClass: 'red'   },
  ];

  const STAT_ICONS = { total: '📋', pending: '⏳', accepted: '✅', rejected: '❌' };

  const FILTER_OPTIONS = [
    { value: 'барлығы',      label: t('dashboard.filters.all'),      count: stats.total    },
    { value: 'күтілуде',     label: t('dashboard.filters.pending'),  count: stats.pending  },
    { value: 'қабылданды',   label: t('dashboard.filters.accepted'), count: stats.accepted },
    { value: 'қабылданбады', label: t('dashboard.filters.rejected'), count: stats.rejected },
  ];

  const filteredApplications =
    statusFilter === 'барлығы'
      ? applications
      : applications.filter((app) => app.status === statusFilter);

  const handleDelete = async (applicationId) => {
    const result = await removeApplication(applicationId);
    if (result.success) {
      setActionMessage({ type: 'success', text: t('dashboard.deleteSuccess') });
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3500);
    } else {
      setActionMessage({ type: 'error', text: result.message });
    }
    return result;
  };

  const firstName =
    currentUser?.fullName?.split(' ')[1] ||
    currentUser?.fullName?.split(' ')[0] ||
    t('nav.role.applicant');

  return (
    <>
      <Navbar />
      <main className="main-content">
        <div className="container">

          {/* ── Hero bar: greeting + new application button ── */}
          <div className="dash-hero">
            <div className="dash-hero-text">
              <h1 className="dash-hero-title">
                {t('dashboard.greeting')}, {firstName}!
              </h1>
              <p className="dash-hero-sub">{t('dashboard.subtitle')}</p>
            </div>
            <Link to="/applications/new" className="btn-cta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {t('dashboard.newApplication')}
            </Link>
          </div>

          {/* ── Stats — horizontal row with left colored border ── */}
          <div className="stats-grid">
            {STAT_CONFIG.map((s) => (
              <div key={s.key} className={`stat-card ${s.colorClass}`}>
                <div className="stat-card-icon">{STAT_ICONS[s.key]}</div>
                <div className="stat-card-body">
                  <div className="stat-number">{stats[s.key]}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Action message ── */}
          {actionMessage.text && (
            <div className={`alert ${actionMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              <span className="alert-icon">{actionMessage.type === 'success' ? '✅' : '⚠️'}</span>
              <span className="alert-text">{actionMessage.text}</span>
              <button className="alert-close" onClick={() => setActionMessage({ type: '', text: '' })}>✕</button>
            </div>
          )}

          {/* ── Filter tabs (underline style) + results count ── */}
          <div className="dash-toolbar">
            <div className="filter-bar">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`filter-pill ${statusFilter === opt.value ? 'active' : ''}`}
                >
                  {opt.label}
                  <span className="pill-count">{opt.count}</span>
                </button>
              ))}
            </div>
            {!isLoading && (
              <span className="dash-results">
                {filteredApplications.length} {t('dashboard.results')}
              </span>
            )}
          </div>

          {/* ── Content ── */}
          {isLoading && <LoadingSpinner text={t('common.loadingApps')} />}

          {!isLoading && error && (
            <ErrorMessage message={error} onDismiss={loadApplications} />
          )}

          {!isLoading && !error && (
            filteredApplications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-illustration">
                  {statusFilter === 'барлығы' ? '📭' : '🔍'}
                </div>
                <h3>
                  {statusFilter === 'барлығы'
                    ? t('dashboard.empty.title')
                    : t('dashboard.emptyFiltered.title', {
                        status: getLocalizedValue(language, 'statuses', statusFilter),
                      })}
                </h3>
                <p>
                  {statusFilter === 'барлығы'
                    ? t('dashboard.empty.desc')
                    : t('dashboard.emptyFiltered.desc')}
                </p>
                {statusFilter === 'барлығы' && (
                  <Link to="/applications/new" className="btn-cta" style={{ margin: '0 auto' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    {t('dashboard.empty.button')}
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* Table header row */}
                <div className="app-table-header">
                  <div className="app-table-col">{t('dashboard.cols.speciality')}</div>
                  <div className="app-table-col">{t('dashboard.cols.faculty')}</div>
                  <div className="app-table-col center">{t('dashboard.cols.ent')}</div>
                  <div className="app-table-col">{t('dashboard.cols.status')}</div>
                  <div className="app-table-col">{t('dashboard.cols.date')}</div>
                  <div className="app-table-col right">{t('dashboard.cols.action')}</div>
                </div>

                {/* Application rows */}
                <div className="applications-grid">
                  {filteredApplications.map((application) => (
                    <ApplicationCard
                      key={application._id}
                      application={application}
                      onDelete={handleDelete}
                      onStatusChange={changeApplicationStatus}
                    />
                  ))}
                </div>
              </>
            )
          )}
        </div>
      </main>
    </>
  );
};

export default ApplicantDashboard;

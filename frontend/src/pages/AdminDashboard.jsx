import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useTranslation from '../hooks/useTranslation';
import useApplications from '../hooks/useApplications';
import ApplicantModal from '../components/ApplicantModal';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { getLocalizedValue, formatLocalizedDate, STATUS_OPTIONS } from '../utils/localization';

const PAGE_SIZE = 10;

const AdminDashboard = () => {
  const { t, language } = useTranslation();
  const {
    applications, isLoading, error,
    loadApplications, removeApplication, changeApplicationStatus,
  } = useApplications();

  const [statusFilter, setStatusFilter] = useState('барлығы');
  const [searchQuery, setSearchQuery]   = useState('');
  const [sortKey, setSortKey]           = useState('');
  const [sortDir, setSortDir]           = useState('asc');
  const [currentPage, setCurrentPage]   = useState(1);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Per-row state for status panel and delete confirm
  const [changingStatusId, setChangingStatusId] = useState(null);
  const [statusData, setStatusData]             = useState({});
  const [savingStatusId, setSavingStatusId]     = useState(null);
  const [confirmDeleteId, setConfirmDeleteId]   = useState(null);
  const [deletingId, setDeletingId]             = useState(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [modalReloadKey, setModalReloadKey] = useState(0);

  const totalCount    = applications.length;
  const pendingCount  = applications.filter((a) => a.status === 'күтілуде').length;
  const acceptedCount = applications.filter((a) => a.status === 'қабылданды').length;
  const rejectedCount = applications.filter((a) => a.status === 'қабылданбады').length;

  const STAT_CONFIG = [
    { label: t('admin.stats.total'),    count: totalCount,    icon: '📋', colorClass: 'blue'  },
    { label: t('admin.stats.pending'),  count: pendingCount,  icon: '⏳', colorClass: 'amber' },
    { label: t('admin.stats.accepted'), count: acceptedCount, icon: '✅', colorClass: 'green' },
    { label: t('admin.stats.rejected'), count: rejectedCount, icon: '❌', colorClass: 'red'   },
  ];

  // Filter + search
  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus = statusFilter === 'барлығы' || app.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        app.speciality?.toLowerCase().includes(q) ||
        getLocalizedValue(language, 'specialities', app.speciality).toLowerCase().includes(q) ||
        app.faculty?.toLowerCase().includes(q) ||
        getLocalizedValue(language, 'faculties', app.faculty).toLowerCase().includes(q) ||
        app.applicant?.fullName?.toLowerCase().includes(q) ||
        app.applicant?.email?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [applications, statusFilter, searchQuery, language]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      let av = sortKey === 'entExamScore' ? a.entExamScore : (a[sortKey] || '');
      let bv = sortKey === 'entExamScore' ? b.entExamScore : (b[sortKey] || '');
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated  = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const getSortArrow = (key) => {
    if (sortKey !== key) return <span className="sort-arrow">↕</span>;
    return <span className="sort-arrow active">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  // Search/filter reset page
  const handleSearch = (val) => { setSearchQuery(val); setCurrentPage(1); };
  const handleFilter = (val) => { setStatusFilter(val); setCurrentPage(1); };

  // Delete
  const handleDelete = async (id) => {
    setDeletingId(id);
    const result = await removeApplication(id);
    if (result.success) {
      setActionMessage({ type: 'success', text: t('admin.deleteSuccess') });
      setConfirmDeleteId(null);
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3000);
    } else {
      setActionMessage({ type: 'error', text: result.message });
    }
    setDeletingId(null);
    return result;
  };

  // Status change
  const initStatusChange = (app) => {
    setChangingStatusId(app._id);
    setStatusData((prev) => ({
      ...prev,
      [app._id]: { status: app.status, note: app.adminNote || '' },
    }));
  };

  const handleStatusSave = async (id) => {
    setSavingStatusId(id);
    const { status, note } = statusData[id] || {};
    const result = await changeApplicationStatus(id, status, note);
    if (result.success) {
      setChangingStatusId(null);
      if (selectedApplicationId === id) {
        setModalReloadKey((prev) => prev + 1);
      }
      setActionMessage({
        type: 'success',
        text: t('admin.statusSuccess', { status: getLocalizedValue(language, 'statuses', status) }),
      });
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3000);
    } else {
      setActionMessage({ type: 'error', text: result.message });
    }
    setSavingStatusId(null);
    return result;
  };

  const STATUS_CLASS = {
    'күтілуде':     'pending',
    'қабылданды':   'accepted',
    'қабылданбады': 'rejected',
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '…') {
        pages.push('…');
      }
    }
    return (
      <div className="pagination">
        <button
          className="page-btn"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          {t('common.prev')}
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`dots-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>…</span>
          ) : (
            <button
              key={p}
              className={`page-btn ${currentPage === p ? 'active' : ''}`}
              onClick={() => setCurrentPage(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          className="page-btn"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          {t('common.next')}
        </button>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <main className="main-content">
        <div className="container">

          {/* ── Hero ── */}
          <div className="dash-hero">
            <div className="dash-hero-text">
              <h1 className="dash-hero-title">{t('admin.title')}</h1>
              <p className="dash-hero-sub">{t('admin.subtitle')}</p>
            </div>
            <Link to="/admin/analytics" className="btn btn-secondary">
              📊 {t('admin.analyticsBtn')}
            </Link>
          </div>

          {/* ── Stats ── */}
          <div className="stats-grid">
            {STAT_CONFIG.map((s) => (
              <div key={s.label} className={`stat-card ${s.colorClass}`}>
                <div className="stat-card-icon">{s.icon}</div>
                <div className="stat-card-body">
                  <div className="stat-number">{s.count}</div>
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

          {/* ── Toolbar: search + dropdown filter + count ── */}
          <div className="admin-toolbar">
            <div className="admin-search-wrap">
              <span className="admin-search-icon">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t('admin.searchPlaceholder')}
                className="form-input admin-search"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => handleFilter(e.target.value)}
              className="admin-filter-select"
            >
              <option value="барлығы">{t('admin.filters.all')}</option>
              <option value="күтілуде">{t('admin.filters.pending')}</option>
              <option value="қабылданды">{t('admin.filters.accepted')}</option>
              <option value="қабылданбады">{t('admin.filters.rejected')}</option>
            </select>
            <span className="dash-results">
              {sorted.length} {t('admin.found')}
            </span>
          </div>

          {/* ── Loading ── */}
          {isLoading && <LoadingSpinner text={t('common.loadingApps')} />}

          {/* ── Error ── */}
          {!isLoading && error && (
            <ErrorMessage message={error} onDismiss={loadApplications} />
          )}

          {/* ── Data table ── */}
          {!isLoading && !error && (
            <>
              {sorted.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-illustration">
                    {searchQuery || statusFilter !== 'барлығы' ? '🔍' : '📭'}
                  </div>
                  <h3>
                    {searchQuery || statusFilter !== 'барлығы'
                      ? t('admin.empty.search')
                      : t('admin.empty.noData')}
                  </h3>
                  <p>
                    {searchQuery || statusFilter !== 'барлығы'
                      ? t('admin.empty.searchDesc')
                      : t('admin.empty.noDataDesc')}
                  </p>
                </div>
              ) : (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="td-num">{t('admin.cols.num')}</th>
                        <th
                          className="sortable"
                          onClick={() => handleSort('applicant')}
                        >
                          {t('admin.cols.applicant')} {getSortArrow('applicant')}
                        </th>
                        <th>{t('admin.cols.speciality')}</th>
                        <th
                          className="sortable td-ent"
                          style={{ textAlign: 'center' }}
                          onClick={() => handleSort('entExamScore')}
                        >
                          {t('admin.cols.ent')} {getSortArrow('entExamScore')}
                        </th>
                        <th
                          className="sortable"
                          onClick={() => handleSort('status')}
                        >
                          {t('admin.cols.status')} {getSortArrow('status')}
                        </th>
                        <th className="td-docs">{t('admin.cols.docs')}</th>
                        <th className="td-actions">{t('admin.cols.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((app, idx) => {
                        const globalIdx = (currentPage - 1) * PAGE_SIZE + idx + 1;
                        const statusClass = STATUS_CLASS[app.status] || 'pending';
                        const isChanging = changingStatusId === app._id;
                        const isConfirm  = confirmDeleteId === app._id;
                        const sd = statusData[app._id] || { status: app.status, note: app.adminNote || '' };

                        return (
                          <Fragment key={app._id}>
                            <tr
                              className="admin-row-clickable"
                              onClick={() => setSelectedApplicationId(app._id)}
                            >
                              <td className="td-num">{globalIdx}</td>

                              {/* Applicant */}
                              <td className="td-applicant admin-row-primary">
                                {app.applicant ? (
                                  <>
                                    <div className="app-card-applicant-name">{app.applicant.fullName}</div>
                                    <div className="app-card-applicant-email">{app.applicant.email}</div>
                                  </>
                                ) : '—'}
                              </td>

                              {/* Speciality / Faculty */}
                              <td>
                                <div className="app-card-title" style={{ fontSize: '0.85rem' }}>
                                  {getLocalizedValue(language, 'specialities', app.speciality)}
                                </div>
                                <div className="app-card-faculty">
                                  {getLocalizedValue(language, 'faculties', app.faculty)}
                                </div>
                              </td>

                              {/* ENT */}
                              <td className="td-ent">{app.entExamScore}</td>

                              {/* Status */}
                              <td>
                                <span className={`status-badge ${statusClass}`}>
                                  {getLocalizedValue(language, 'statuses', app.status)}
                                </span>
                              </td>

                              {/* Docs count */}
                              <td className="td-docs">{app.documents?.length || 0}</td>

                              {/* Actions */}
                              <td className="td-actions">
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                  {!isChanging && !isConfirm && (
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        initStatusChange(app);
                                      }}
                                      className="btn btn-ghost btn-sm"
                                      style={{ padding: '4px 10px', color: 'var(--primary)' }}
                                    >
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <polyline points="9 11 12 14 22 4"/>
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                                      </svg>
                                      {t('card.statusChange')}
                                    </button>
                                  )}
                                  {!isChanging && !isConfirm && (
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setConfirmDeleteId(app._id);
                                      }}
                                      className="btn btn-sm app-card-delete-btn"
                                      style={{ padding: '4px 8px' }}
                                    >
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                        <path d="M10 11v6"/><path d="M14 11v6"/>
                                      </svg>
                                    </button>
                                  )}
                                  {isConfirm && (
                                    <>
                                      <button
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleDelete(app._id);
                                        }}
                                        disabled={deletingId === app._id}
                                        className="btn btn-danger btn-sm"
                                      >
                                        {deletingId === app._id
                                          ? <><span className="spinner-sm" /> {t('card.deleting')}</>
                                          : t('card.confirm')}
                                      </button>
                                      <button
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setConfirmDeleteId(null);
                                        }}
                                        className="btn btn-secondary btn-sm"
                                      >
                                        {t('card.cancelConfirm')}
                                      </button>
                                    </>
                                  )}
                                  {isChanging && (
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setChangingStatusId(null);
                                      }}
                                      className="btn btn-secondary btn-sm"
                                    >
                                      {t('card.cancel')}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* Status change panel row */}
                            {isChanging && (
                              <tr key={`${app._id}-panel`} className="status-panel-row">
                                <td colSpan={7}>
                                  <div
                                    className="status-panel-inner"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                      <div style={{ flex: 1, minWidth: 160 }}>
                                        <label className="form-label" style={{ marginBottom: 4 }}>{t('card.statusChange')}</label>
                                        <select
                                          value={sd.status}
                                          onChange={(e) =>
                                            setStatusData((prev) => ({
                                              ...prev,
                                              [app._id]: { ...prev[app._id], status: e.target.value },
                                            }))
                                          }
                                          className="form-select"
                                          style={{ fontSize: '0.85rem' }}
                                        >
                                          {STATUS_OPTIONS.map(({ value }) => (
                                            <option key={value} value={value}>
                                              {getLocalizedValue(language, 'statuses', value)}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div style={{ flex: 2, minWidth: 200 }}>
                                        <label className="form-label" style={{ marginBottom: 4 }}>{t('card.note')}</label>
                                        <input
                                          type="text"
                                          value={sd.note}
                                          onChange={(e) =>
                                            setStatusData((prev) => ({
                                              ...prev,
                                              [app._id]: { ...prev[app._id], note: e.target.value },
                                            }))
                                          }
                                          placeholder={t('card.notePlaceholder')}
                                          className="form-input"
                                          style={{ fontSize: '0.85rem' }}
                                          maxLength={500}
                                        />
                                      </div>
                                      <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                                        <button
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            handleStatusSave(app._id);
                                          }}
                                          disabled={savingStatusId === app._id}
                                          className="btn btn-primary btn-sm"
                                        >
                                          {savingStatusId === app._id
                                            ? <><span className="spinner-sm" /> {t('card.saving')}</>
                                            : t('card.save')}
                                        </button>
                                        <button
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setChangingStatusId(null);
                                          }}
                                          className="btn btn-secondary btn-sm"
                                        >
                                          {t('card.cancel')}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {renderPagination()}
            </>
          )}
        </div>
      </main>
      <ApplicantModal
        applicationId={selectedApplicationId}
        isOpen={Boolean(selectedApplicationId)}
        onClose={() => setSelectedApplicationId('')}
        reloadKey={modalReloadKey}
      />
    </>
  );
};

export default AdminDashboard;

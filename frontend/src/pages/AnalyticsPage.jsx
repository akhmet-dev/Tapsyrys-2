import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import useTranslation from '../hooks/useTranslation';
import { getLocalizedValue } from '../utils/localization';

const statusBadgeClass = (status) => {
  if (status === 'қабылданды')   return 'accepted';
  if (status === 'қабылданбады') return 'rejected';
  return 'pending';
};

const AnalyticsPage = () => {
  const { t, language } = useTranslation();

  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/admin/analytics');
        setAnalytics(response.data.data);
      } catch {
        setError(t('analytics.error'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <LoadingSpinner fullPage text={t('analytics.loading')} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="main-content">
          <div className="container">
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span className="alert-text">{error}</span>
            </div>
            <Link to="/admin" className="btn btn-secondary" style={{ marginTop: 'var(--sp-4)' }}>
              {t('analytics.backToAdmin')}
            </Link>
          </div>
        </main>
      </>
    );
  }

  const {
    totalApplications, byStatus, bySpeciality, byFaculty,
    byFunding, byCity, noCityCount, recentApplications,
  } = analytics;

  const maxSpecialityCount = bySpeciality.length > 0
    ? Math.max(...bySpeciality.map((s) => s.count)) : 1;

  const maxFacultyCount = byFaculty?.length > 0
    ? Math.max(...byFaculty.map((f) => f.count)) : 1;

  const maxCityCount = byCity?.length > 0
    ? Math.max(...byCity.map((c) => c.count)) : 1;

  const grantPercent = totalApplications > 0
    ? Math.round((byFunding.grant / totalApplications) * 100) : 0;
  const paidPercent = 100 - grantPercent;

  const STATUS_CONFIG = [
    { key: 'pending',  label: t('analytics.stats.pending'),  icon: '⏳', colorClass: 'amber' },
    { key: 'accepted', label: t('analytics.stats.accepted'), icon: '✅', colorClass: 'green' },
    { key: 'rejected', label: t('analytics.stats.rejected'), icon: '❌', colorClass: 'red'   },
  ];

  return (
    <>
      <Navbar />
      <main className="main-content">
        <div className="container">

          {/* ── Hero ── */}
          <div className="dash-hero">
            <div className="dash-hero-text">
              <h1 className="dash-hero-title">📊 {t('analytics.title')}</h1>
              <p className="dash-hero-sub">{t('analytics.subtitle')}</p>
            </div>
            <Link to="/admin" className="btn btn-secondary">{t('analytics.backToAdmin')}</Link>
          </div>

          {/* ── KPI cards ── */}
          <div className="stats-grid" style={{ marginBottom: 'var(--sp-8)' }}>
            <div className="stat-card blue">
              <div className="stat-card-icon">📋</div>
              <div className="stat-card-body">
                <div className="stat-number">{totalApplications}</div>
                <div className="stat-label">{t('analytics.stats.total')}</div>
              </div>
            </div>
            <div className="stat-card amber">
              <div className="stat-card-icon">⏳</div>
              <div className="stat-card-body">
                <div className="stat-number">{byStatus.pending}</div>
                <div className="stat-label">{t('analytics.stats.pending')}</div>
              </div>
            </div>
            <div className="stat-card green">
              <div className="stat-card-icon">✅</div>
              <div className="stat-card-body">
                <div className="stat-number">{byStatus.accepted}</div>
                <div className="stat-label">{t('analytics.stats.accepted')}</div>
              </div>
            </div>
            <div className="stat-card red">
              <div className="stat-card-icon">❌</div>
              <div className="stat-card-body">
                <div className="stat-number">{byStatus.rejected}</div>
                <div className="stat-label">{t('analytics.stats.rejected')}</div>
              </div>
            </div>
          </div>

          {/* ── Row 1: speciality + funding ── */}
          <div className="analytics-grid">

            {/* Speciality bar chart */}
            <div className="analytics-card">
              <h2 className="analytics-card-title">📚 {t('analytics.bySpeciality')}</h2>
              {bySpeciality.length === 0 ? (
                <p className="analytics-empty">{t('analytics.noData')}</p>
              ) : (
                <div className="bar-chart">
                  {bySpeciality.map((item) => {
                    const w = Math.round((item.count / maxSpecialityCount) * 100);
                    const label = getLocalizedValue(language, 'specialities', item.name);
                    return (
                      <div key={item.name} className="bar-row">
                        <div className="bar-label" title={label}>
                          {label.length > 26 ? label.slice(0, 26) + '…' : label}
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${w}%` }} />
                        </div>
                        <div className="bar-value">{item.count}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Funding split */}
            <div className="analytics-card">
              <h2 className="analytics-card-title">💰 {t('analytics.fundingType')}</h2>
              <div className="funding-visual">
                <div>
                  <div className="funding-bar">
                    <div className="funding-bar-grant" style={{ width: `${grantPercent}%` }} />
                  </div>
                  <div className="funding-bar-labels">
                    <span style={{ color: 'var(--secondary)' }}>{t('analytics.grantLabel')} {grantPercent}%</span>
                    <span style={{ color: 'var(--primary)' }}>{t('analytics.paidLabel')} {paidPercent}%</span>
                  </div>
                </div>
                <div className="funding-stats">
                  <div className="funding-stat-item">
                    <div className="funding-dot grant" />
                    <div>
                      <div className="funding-stat-label">🎓 {t('analytics.grantLabel')}</div>
                      <div className="funding-stat-number">{byFunding.grant}</div>
                    </div>
                  </div>
                  <div className="funding-stat-divider" />
                  <div className="funding-stat-item">
                    <div className="funding-dot paid" />
                    <div>
                      <div className="funding-stat-label">💵 {t('analytics.paidLabel')}</div>
                      <div className="funding-stat-number">{byFunding.paid}</div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 'var(--sp-5)' }}>
                  <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--sp-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {t('analytics.statusDist')}
                  </h3>
                  {STATUS_CONFIG.map(({ key, label, icon, colorClass }) => {
                    const count = byStatus[key] || 0;
                    const pct = totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0;
                    return (
                      <div key={key} style={{ marginBottom: 'var(--sp-3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                          <span>{icon} {label}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{count} ({pct}%)</span>
                        </div>
                        <div className="mini-bar-track">
                          <div className={`mini-bar-fill ${colorClass}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 2: faculty + geography ── */}
          <div className="analytics-grid" style={{ marginTop: 'var(--sp-6)' }}>

            {/* Faculty bar chart */}
            <div className="analytics-card">
              <h2 className="analytics-card-title">🏛️ {t('analytics.byFaculty')}</h2>
              {!byFaculty || byFaculty.length === 0 ? (
                <p className="analytics-empty">{t('analytics.noData')}</p>
              ) : (
                <div className="bar-chart">
                  {byFaculty.map((item) => {
                    const w = Math.round((item.count / maxFacultyCount) * 100);
                    const label = getLocalizedValue(language, 'faculties', item.name);
                    return (
                      <div key={item.name} className="bar-row">
                        <div className="bar-label" title={label}>
                          {label.length > 26 ? label.slice(0, 26) + '…' : label}
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${w}%`, background: 'linear-gradient(90deg, var(--secondary), #43a047)' }} />
                        </div>
                        <div className="bar-value">{item.count}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Geography chart */}
            <div className="analytics-card">
              <h2 className="analytics-card-title">🌍 {t('analytics.geography')}</h2>
              {!byCity || byCity.length === 0 ? (
                <div>
                  <p className="analytics-empty">{t('analytics.noCity')}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: 'var(--sp-2)' }}>
                    {t('analytics.noCityCount').replace('{{count}}', noCityCount || 0)}
                  </p>
                </div>
              ) : (
                <>
                  <div className="bar-chart">
                    {byCity.map((item) => {
                      const w = Math.round((item.count / maxCityCount) * 100);
                      return (
                        <div key={item.name} className="bar-row">
                          <div className="bar-label" title={item.name}>
                            {item.name.length > 18 ? item.name.slice(0, 18) + '…' : item.name}
                          </div>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: `${w}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }} />
                          </div>
                          <div className="bar-value">{item.count}</div>
                        </div>
                      );
                    })}
                  </div>
                  {noCityCount > 0 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--sp-3)', textAlign: 'right' }}>
                      {t('analytics.noCityCount').replace('{{count}}', noCityCount)}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Recent applications ── */}
          <div className="analytics-card" style={{ marginTop: 'var(--sp-6)' }}>
            <h2 className="analytics-card-title">🕐 {t('analytics.recent')}</h2>
            {recentApplications.length === 0 ? (
              <p className="analytics-empty">{t('analytics.noApps')}</p>
            ) : (
              <div className="recent-list">
                {recentApplications.map((app) => (
                  <div key={app._id} className="recent-item">
                    <div className="recent-item-info">
                      <span className="recent-item-name">{app.applicantName}</span>
                      <span className="recent-item-speciality">
                        {getLocalizedValue(language, 'specialities', app.speciality)}
                      </span>
                    </div>
                    <div className="recent-item-right">
                      <span className="recent-item-score">ЕНТ: {app.entExamScore}</span>
                      <span className={`status-badge ${statusBadgeClass(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <style>{`
        .analytics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--sp-6);
        }
        @media (max-width: 768px) { .analytics-grid { grid-template-columns: 1fr; } }
        .analytics-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: var(--sp-6);
          box-shadow: var(--shadow-md);
        }
        .analytics-card-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 var(--sp-5) 0;
          padding-bottom: var(--sp-3);
          border-bottom: 1px solid var(--border-color);
        }
        .analytics-empty {
          color: var(--text-secondary);
          text-align: center;
          padding: var(--sp-6) 0;
          font-size: 0.9rem;
        }
        .bar-chart { display: flex; flex-direction: column; gap: var(--sp-3); }
        .bar-row { display: flex; align-items: center; gap: var(--sp-3); }
        .bar-label {
          width: 150px; min-width: 100px;
          font-size: 0.78rem; color: var(--text-secondary);
          text-align: right; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis; flex-shrink: 0;
        }
        .bar-track {
          flex: 1; height: 20px;
          background: var(--bg-page);
          border-radius: 10px; overflow: hidden;
          border: 1px solid var(--border-color);
        }
        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), #4a7fc1);
          border-radius: 10px; min-width: 4px;
          transition: width 0.5s ease;
        }
        .bar-value { width: 28px; font-size: 0.82rem; font-weight: 700; color: var(--text-primary); text-align: right; flex-shrink: 0; }

        .funding-visual { display: flex; flex-direction: column; gap: var(--sp-4); }
        .funding-bar {
          height: 26px; background: var(--bg-page);
          border-radius: 13px; overflow: hidden;
          margin-bottom: var(--sp-2); border: 1px solid var(--border-color);
        }
        .funding-bar-grant {
          height: 100%;
          background: linear-gradient(90deg, var(--secondary), #43a047);
          border-radius: 13px; transition: width 0.5s ease;
        }
        .funding-bar-labels { display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 600; }
        .funding-stats {
          display: flex; align-items: center; gap: var(--sp-5);
          background: var(--bg-page); border-radius: var(--radius);
          padding: var(--sp-4); border: 1px solid var(--border-color);
        }
        .funding-stat-divider { width: 1px; height: 40px; background: var(--border-color); }
        .funding-stat-item { display: flex; align-items: center; gap: var(--sp-3); flex: 1; }
        .funding-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
        .funding-dot.grant { background: var(--secondary); }
        .funding-dot.paid  { background: var(--primary); }
        .funding-stat-label { font-size: 0.78rem; color: var(--text-secondary); }
        .funding-stat-number { font-size: 1.35rem; font-weight: 800; color: var(--text-primary); }

        .mini-bar-track { height: 8px; background: var(--bg-page); border-radius: 4px; overflow: hidden; border: 1px solid var(--border-color); }
        .mini-bar-fill { height: 100%; border-radius: 4px; min-width: 2px; transition: width 0.4s ease; }
        .mini-bar-fill.amber { background: #f59e0b; }
        .mini-bar-fill.green { background: var(--secondary); }
        .mini-bar-fill.red   { background: var(--accent); }

        .recent-list { display: flex; flex-direction: column; gap: var(--sp-2); }
        .recent-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: var(--sp-3) var(--sp-4);
          background: var(--bg-page); border-radius: var(--radius);
          border: 1px solid var(--border-color); gap: var(--sp-4);
        }
        .recent-item-info { display: flex; flex-direction: column; gap: 2px; }
        .recent-item-name { font-weight: 600; font-size: 0.9rem; color: var(--text-primary); }
        .recent-item-speciality { font-size: 0.78rem; color: var(--text-secondary); }
        .recent-item-right { display: flex; align-items: center; gap: var(--sp-3); flex-shrink: 0; }
        .recent-item-score { font-size: 0.82rem; font-weight: 600; color: var(--primary); white-space: nowrap; }
        @media (max-width: 480px) {
          .bar-label { width: 80px; min-width: 60px; font-size: 0.72rem; }
          .recent-item { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </>
  );
};

export default AnalyticsPage;

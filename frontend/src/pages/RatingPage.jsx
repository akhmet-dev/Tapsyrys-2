import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import useTranslation from '../hooks/useTranslation';
import { getLocalizedValue } from '../utils/localization';

const MEDAL_CONFIG = {
  1: { icon: '🥇', color: '#D4A017', bg: 'rgba(255, 215, 0, 0.08)', border: '#FFD700' },
  2: { icon: '🥈', color: '#888',    bg: 'rgba(192, 192, 192, 0.1)', border: '#C0C0C0' },
  3: { icon: '🥉', color: '#A0522D', bg: 'rgba(205, 127, 50, 0.1)',  border: '#CD7F32' },
};

const RatingPage = () => {
  const { t, language } = useTranslation();

  const [ratingList, setRatingList] = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState('');
  const [fundingFilter, setFundingFilter] = useState('all');

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const response = await api.get('/rating');
        setRatingList(response.data.data || []);
      } catch {
        setError(t('rating.error'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchRating();
  }, []);

  const filtered = useMemo(() => {
    if (fundingFilter === 'all') return ratingList;
    if (fundingFilter === 'grant') return ratingList.filter((e) => e.fundingType === 'грант');
    return ratingList.filter((e) => e.fundingType !== 'грант');
  }, [ratingList, fundingFilter]);

  const FILTERS = [
    { value: 'all',   label: t('rating.filterAll')   },
    { value: 'grant', label: t('rating.filterGrant') },
    { value: 'paid',  label: t('rating.filterPaid')  },
  ];

  return (
    <>
      <Navbar />
      <main className="main-content">
        <div className="container">

          {/* ── Hero ── */}
          <div className="dash-hero">
            <div className="dash-hero-text">
              <h1 className="dash-hero-title">🏆 {t('rating.title')}</h1>
              <p className="dash-hero-sub">{t('rating.subtitle')}</p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => window.print()}
              title={t('rating.export')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {t('rating.export')}
            </button>
          </div>

          {isLoading && <LoadingSpinner text={t('rating.loading')} />}

          {!isLoading && error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span className="alert-text">{error}</span>
            </div>
          )}

          {!isLoading && !error && ratingList.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-illustration">🏆</div>
              <h3>{t('rating.emptyTitle')}</h3>
              <p>{t('rating.emptyDesc')}</p>
            </div>
          )}

          {!isLoading && !error && ratingList.length > 0 && (
            <>
              {/* ── Filter tabs + count ── */}
              <div className="dash-toolbar">
                <div className="filter-bar">
                  {FILTERS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFundingFilter(f.value)}
                      className={`filter-pill ${fundingFilter === f.value ? 'active' : ''}`}
                    >
                      {f.label}
                      <span className="pill-count">
                        {f.value === 'all'   ? ratingList.length
                         : f.value === 'grant' ? ratingList.filter((e) => e.fundingType === 'грант').length
                         : ratingList.filter((e) => e.fundingType !== 'грант').length}
                      </span>
                    </button>
                  ))}
                </div>
                <span className="dash-results">
                  {filtered.length} {t('rating.total')}
                </span>
              </div>

              {/* ── Table ── */}
              <div className="rating-table-wrap">
                <table className="rating-table">
                  <thead>
                    <tr>
                      <th className="rating-th rating-th-rank">{t('rating.cols.rank')}</th>
                      <th className="rating-th">{t('rating.cols.name')}</th>
                      <th className="rating-th">{t('rating.cols.speciality')}</th>
                      <th className="rating-th rating-th-score">{t('rating.cols.score')}</th>
                      <th className="rating-th">{t('rating.cols.funding')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry) => {
                      const medal = MEDAL_CONFIG[entry.rank];
                      return (
                        <tr
                          key={entry.rank}
                          className="rating-row"
                          style={medal ? { background: medal.bg, borderLeft: `3px solid ${medal.border}` } : {}}
                        >
                          <td className="rating-td rating-td-rank">
                            {medal
                              ? <span className="rating-medal" style={{ color: medal.color }}>{medal.icon}</span>
                              : <span className="rating-rank-num">{entry.rank}</span>}
                          </td>
                          <td className="rating-td rating-td-name">
                            <span className="rating-name">{entry.applicantName}</span>
                          </td>
                          <td className="rating-td">
                            <span className="rating-speciality">
                              {getLocalizedValue(language, 'specialities', entry.speciality)}
                            </span>
                            <span className="rating-faculty">
                              {getLocalizedValue(language, 'faculties', entry.faculty)}
                            </span>
                          </td>
                          <td className="rating-td rating-td-score">
                            <span
                              className="rating-score"
                              style={medal ? { color: medal.color, fontWeight: 700 } : {}}
                            >
                              {entry.entExamScore}
                            </span>
                          </td>
                          <td className="rating-td">
                            <span className={`status-badge ${entry.fundingType === 'грант' ? 'accepted' : 'pending'}`}>
                              {entry.fundingType === 'грант' ? t('rating.grant') : t('rating.paid')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Legend ── */}
              <div className="rating-legend">
                <span style={{ color: MEDAL_CONFIG[1].color }}>🥇 1</span>
                <span style={{ color: MEDAL_CONFIG[2].color }}>🥈 2</span>
                <span style={{ color: MEDAL_CONFIG[3].color }}>🥉 3</span>
                <span style={{ color: 'var(--text-secondary)', marginLeft: 'auto', fontSize: '0.8rem' }}>
                  {t('rating.note')}
                </span>
              </div>
            </>
          )}

          {/* ── Back link ── */}
          <div style={{ marginTop: 'var(--sp-8)', textAlign: 'center' }}>
            <Link to="/" className="btn btn-secondary">
              {t('rating.backHome')}
            </Link>
          </div>
        </div>
      </main>

      <style>{`
        .rating-table-wrap {
          overflow-x: auto;
          border-radius: var(--radius);
          box-shadow: var(--shadow-md);
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          margin-bottom: var(--sp-4);
        }
        .rating-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        .rating-th {
          padding: 12px 16px;
          text-align: left;
          background: var(--bg-page);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid var(--border-color);
          white-space: nowrap;
        }
        .rating-th-rank  { width: 60px; text-align: center; }
        .rating-th-score { text-align: center; width: 100px; }
        .rating-row {
          border-bottom: 1px solid var(--border-color);
          transition: background 0.12s;
        }
        .rating-row:last-child { border-bottom: none; }
        .rating-row:nth-child(even):not([style]) { background: #f8f9fb; }
        .rating-row:hover { background: var(--primary-light) !important; }
        .rating-td {
          padding: 13px 16px;
          vertical-align: middle;
          color: var(--text-primary);
        }
        .rating-td-rank  { text-align: center; }
        .rating-td-score { text-align: center; }
        .rating-medal { font-size: 1.4rem; display: inline-block; }
        .rating-rank-num { font-weight: 600; color: var(--text-secondary); }
        .rating-name { font-weight: 600; color: var(--text-primary); display: block; }
        .rating-speciality { font-weight: 500; display: block; }
        .rating-faculty { font-size: 0.78rem; color: var(--text-secondary); display: block; margin-top: 2px; }
        .rating-score { font-size: 1.05rem; font-weight: 700; color: var(--primary); }
        .rating-legend {
          display: flex;
          gap: var(--sp-5);
          align-items: center;
          font-size: 0.85rem;
          padding: var(--sp-3) var(--sp-4);
          background: var(--bg-page);
          border-radius: var(--radius);
          border: 1px solid var(--border-color);
          flex-wrap: wrap;
        }
        @media (max-width: 640px) {
          .rating-th, .rating-td { padding: 10px 12px; font-size: 0.82rem; }
        }
      `}</style>
    </>
  );
};

export default RatingPage;

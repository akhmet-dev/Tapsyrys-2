import { Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useTranslation from '../hooks/useTranslation';

const NotFoundPage = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const homeLink     = isAuthenticated ? (isAdmin ? '/admin' : '/dashboard') : '/login';
  const homeLinkText = isAuthenticated ? t('notFound.backHome') : t('notFound.backLogin');
  const requestedPath = `${location.pathname || '/'}${location.search || ''}${location.hash || ''}`;

  return (
    <div className="not-found-page">
      <div className="not-found-orb not-found-orb--left" />
      <div className="not-found-orb not-found-orb--right" />
      <div className="not-found-code">{t('notFound.code')}</div>

      <div className="not-found-inner">
        <div className="not-found-gov-icon-wrap">
          <div className="not-found-gov-icon">🏛️</div>
          <div className="not-found-pulse-ring" />
        </div>

        <div className="not-found-divider" />

        <h1 className="not-found-title">{t('notFound.title')}</h1>
        <p className="not-found-desc">{t('notFound.desc')}</p>

        <div className="not-found-reason-card">
          <div className="not-found-reason-label">{t('notFound.reasonLabel')}</div>
          <div className="not-found-reason-text">{t('notFound.reasonText')}</div>
          <code className="not-found-path">{requestedPath}</code>
        </div>

        <div className="not-found-hints">
          <div className="not-found-hint">{t('notFound.hintTypo')}</div>
          <div className="not-found-hint">{t('notFound.hintAccess')}</div>
        </div>

        <Link to={homeLink} className="btn btn-primary btn-lg">
          ← {homeLinkText}
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useSSE from '../hooks/useSSE';
import useTranslation from '../hooks/useTranslation';
import { getPublicFileUrl } from '../services/applicationService';
import {
  fetchApplicantConversations,
  MESSAGE_UPDATE_EVENT,
} from '../services/messageService';

const getInitials = (fullName) => {
  if (!fullName) return '?';
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
};

const Navbar = () => {
  const { currentUser, isAdmin, isAuthenticated, logout } = useAuth();
  const { t, language, switchLanguage, languages } = useTranslation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => { logout(); navigate('/login'); };

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated || isAdmin) {
      setUnreadCount(0);
      return;
    }

    try {
      const conversations = await fetchApplicantConversations();
      const nextUnreadCount = conversations.reduce(
        (total, conversation) => total + conversation.unreadCount,
        0
      );
      setUnreadCount(nextUnreadCount);
    } catch {
      setUnreadCount(0);
    }
  }, [isAdmin, isAuthenticated]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated || isAdmin) {
      return undefined;
    }

    const handleMessagesUpdated = () => {
      refreshUnreadCount();
    };

    window.addEventListener(MESSAGE_UPDATE_EVENT, handleMessagesUpdated);

    return () => {
      window.removeEventListener(MESSAGE_UPDATE_EVENT, handleMessagesUpdated);
    };
  }, [isAdmin, isAuthenticated, refreshUnreadCount]);

  useSSE(
    (payload) => {
      if (payload.type === 'NEW_MESSAGE' || payload.type === 'MESSAGES_READ') {
        refreshUnreadCount();
      }
    },
    isAuthenticated && !isAdmin
  );

  if (!isAuthenticated) return null;

  const homeLink = isAdmin ? '/admin' : '/dashboard';
  const avatarUrl = getPublicFileUrl(currentUser?.avatarUrl);

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">

          {/* ── Left: coat of arms + brand ── */}
          <Link to={homeLink} className="navbar-brand">
            <div className="navbar-brand-icon">🏛️</div>
            <div className="navbar-brand-text">
              <span>{t('nav.brand')}</span>
              <span className="brand-subtitle">{t('nav.subtitle')}</span>
            </div>
          </Link>

          {/* ── Center: nav links ── */}
          <div className="navbar-links">
            <Link to="/rating" className="navbar-link">
              {t('nav.rating')}
            </Link>
            <Link to="/profile" className="navbar-link">
              {t('nav.profile')}
            </Link>
            {!isAdmin && (
              <Link to="/messages" className="navbar-link navbar-link--messages">
                <span>💬 {t('nav.messages')}</span>
                {unreadCount > 0 && (
                  <span className="navbar-notification-badge">{unreadCount}</span>
                )}
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/analytics" className="navbar-link">
                {t('nav.analytics')}
              </Link>
            )}
          </div>

          {/* ── Right section ── */}
          <div className="navbar-right">
            {!isAdmin && (
              <Link to="/messages" className="navbar-mobile-messages">
                <span>💬</span>
                {unreadCount > 0 && (
                  <span className="navbar-notification-badge">{unreadCount}</span>
                )}
              </Link>
            )}

            {/* Language switcher — text only [ҚАЗ] [РУС] */}
            <div className="lang-switcher">
              {Object.values(languages).map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => switchLanguage(lang.code)}
                  className={`lang-btn ${language === lang.code ? 'active' : ''}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* User avatar + name + role */}
            <Link to="/profile" className="navbar-user">
              <div className="navbar-avatar">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={currentUser?.fullName || t('nav.profile')}
                    className="navbar-avatar-image"
                  />
                ) : (
                  getInitials(currentUser?.fullName)
                )}
              </div>
              <div className="navbar-user-info">
                <span className="navbar-user-name">{currentUser?.fullName}</span>
                <span className="navbar-user-role">
                  {isAdmin ? t('nav.role.admin') : t('nav.role.applicant')}
                </span>
              </div>
            </Link>

            {/* Role badge */}
            <span className={`navbar-role-badge ${isAdmin ? 'admin' : ''}`}>
              {isAdmin ? t('nav.roleBadge.admin') : t('nav.roleBadge.applicant')}
            </span>

            {/* Logout — border style */}
            <button onClick={handleLogout} className="btn-logout">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              {t('nav.logout')}
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;

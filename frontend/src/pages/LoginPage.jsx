import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useTranslation from '../hooks/useTranslation';
import { loginUser } from '../services/authService';
import { getErrorMessage } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';
import AuthShowcase from '../components/AuthShowcase';

const LoginPage = () => {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const { t, language, switchLanguage, languages } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!formData.email || !formData.password) {
      setErrorMessage(t('login.errorEmpty'));
      return;
    }
    setIsLoading(true);
    try {
      const data = await loginUser(formData);
      login(data.user, data.token);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* ── Language switcher ── */}
      <div className="auth-lang-switcher">
        {Object.values(languages).map((lang) => (
          <button
            key={lang.code}
            onClick={() => switchLanguage(lang.code)}
            className={`lang-btn ${language === lang.code ? 'active' : ''}`}
          >
            {lang.flag} {lang.label}
          </button>
        ))}
      </div>

      {/* ── Left: hero panel ── */}
      <div className="auth-hero">
        <div className="auth-hero-orb auth-hero-orb-1" />
        <div className="auth-hero-orb auth-hero-orb-2" />
        <div className="auth-grid-lines" />
        <AuthShowcase
          badge={t('login.heroBadge')}
          title={t('login.heroTitle')}
          description={t('login.heroDesc')}
          accentWords={t('auth.loginWords')}
          features={[
            { icon: '📝', text: t('login.heroFeatures')[0] },
            { icon: '📊', text: t('login.heroFeatures')[1] },
            { icon: '🔒', text: t('login.heroFeatures')[2] },
          ]}
          statItems={[
            { value: '24/7', label: t('auth.stats.support') },
            { value: '140', label: t('auth.stats.ent') },
            { value: '100%', label: t('auth.stats.online') },
          ]}
        />
      </div>

      {/* ── Right: form panel ── */}
      <div className="auth-panel">
        <div className="auth-card-shell">
          <div className="auth-card-glow" />
          <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon-wrap">🔑</div>
            <h1 className="auth-title">{t('login.title')}</h1>
            <p className="auth-subtitle">{t('login.subtitle')}</p>
          </div>

          <ErrorMessage message={errorMessage} onDismiss={() => setErrorMessage('')} />

          <form onSubmit={handleSubmit} noValidate className="auth-form">
            <div className="form-group auth-form-item">
              <label htmlFor="email" className="form-label">{t('login.email')}</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('login.emailPlaceholder')}
                className="form-input"
                autoComplete="email"
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group auth-form-item">
              <label htmlFor="password" className="form-label">{t('login.password')}</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={t('login.passwordPlaceholder')}
                className="form-input"
                autoComplete="current-password"
                disabled={isLoading}
                required
              />
            </div>

            <button type="submit" disabled={isLoading} className="btn-auth-submit auth-form-item">
              {isLoading
                ? <><span className="spinner-sm" /> {t('login.loading')}</>
                : <>{t('login.submit')} →</>}
            </button>
          </form>

          <div className="auth-divider" />
          <p className="auth-footer">
            {t('login.noAccount')}{' '}
            <Link to="/register" style={{ fontWeight: 600 }}>{t('login.registerLink')}</Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

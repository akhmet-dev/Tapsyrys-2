import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useTranslation from '../hooks/useTranslation';
import { registerUser } from '../services/authService';
import { getErrorMessage } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';
import AuthShowcase from '../components/AuthShowcase';

const RegisterPage = () => {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const { t, language, switchLanguage, languages } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', city: '', password: '', confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (isAuthenticated) {
    navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const validateForm = () => {
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2)
      return t('register.errors.fullName');
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email))
      return t('register.errors.email');
    if (formData.phone.trim() && !/^[0-9+\-()\s]{7,30}$/.test(formData.phone.trim()))
      return t('register.errors.phone');
    if (formData.password.length < 6)
      return t('register.errors.passwordLength');
    if (formData.password !== formData.confirmPassword)
      return t('register.errors.passwordMatch');
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const err = validateForm();
    if (err) { setErrorMessage(err); return; }
    setIsLoading(true);
    try {
      const { fullName, email, phone, city, password } = formData;
      const data = await registerUser({ fullName, email, phone, city, password });
      login(data.user, data.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = (() => {
    const p = formData.password;
    if (!p) return 0;
    if (p.length < 6) return 1;
    if (p.length < 10) return 2;
    return 3;
  })();
  const strengthLabels = ['', t('register.passwordStrength.weak'), t('register.passwordStrength.medium'), t('register.passwordStrength.strong')];
  const strengthColors = ['', '#EF4444', '#F59E0B', '#10B981'];

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
          badge={t('register.heroBadge')}
          title={t('register.heroTitle')}
          description={t('register.heroDesc')}
          accentWords={t('auth.registerWords')}
          features={[
            { icon: '⚡', text: t('register.heroFeatures')[0] },
            { icon: '📋', text: t('register.heroFeatures')[1] },
            { icon: '🔔', text: t('register.heroFeatures')[2] },
          ]}
          statItems={[
            { value: '2 мин', label: t('auth.stats.fast') },
            { value: '5+', label: t('auth.stats.priorities') },
            { value: 'LIVE', label: t('auth.stats.status') },
          ]}
        />
      </div>

      {/* ── Right: form panel ── */}
      <div className="auth-panel">
        <div className="auth-card-shell">
          <div className="auth-card-glow" />
          <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon-wrap">✨</div>
            <h1 className="auth-title">{t('register.title')}</h1>
            <p className="auth-subtitle">{t('register.subtitle')}</p>
          </div>

          <ErrorMessage message={errorMessage} onDismiss={() => setErrorMessage('')} />

          <form onSubmit={handleSubmit} noValidate className="auth-form">
            <div className="form-group auth-form-item">
              <label htmlFor="fullName" className="form-label">{t('register.fullName')}</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder={t('register.fullNamePlaceholder')}
                className="form-input"
                autoComplete="name"
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group auth-form-item">
              <label htmlFor="city" className="form-label">{t('register.city')}</label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleInputChange}
                placeholder={t('register.cityPlaceholder')}
                className="form-input"
                autoComplete="address-level2"
                disabled={isLoading}
              />
            </div>

            <div className="form-group auth-form-item">
              <label htmlFor="phone" className="form-label">{t('register.phone')}</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder={t('register.phonePlaceholder')}
                className="form-input"
                autoComplete="tel"
                disabled={isLoading}
              />
            </div>

            <div className="form-group auth-form-item">
              <label htmlFor="email" className="form-label">{t('register.email')}</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('register.emailPlaceholder')}
                className="form-input"
                autoComplete="email"
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group auth-form-item">
              <label htmlFor="password" className="form-label">{t('register.password')}</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={t('register.passwordPlaceholder')}
                className="form-input"
                autoComplete="new-password"
                disabled={isLoading}
                required
              />
              {formData.password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        style={{
                          flex: 1,
                          height: '3px',
                          borderRadius: '2px',
                          background: passwordStrength >= level
                            ? strengthColors[passwordStrength]
                            : 'var(--border-color)',
                          transition: 'background 0.3s',
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: strengthColors[passwordStrength] }}>
                    {strengthLabels[passwordStrength]}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group auth-form-item">
              <label htmlFor="confirmPassword" className="form-label">{t('register.confirmPassword')}</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder={t('register.confirmPasswordPlaceholder')}
                className={`form-input ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? 'error' : ''
                }`}
                autoComplete="new-password"
                disabled={isLoading}
                required
              />
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <span style={{ fontSize: '0.75rem', color: '#2E7D32', marginTop: '4px', display: 'block' }}>
                  {t('register.passwordMatch')}
                </span>
              )}
            </div>

            <button type="submit" disabled={isLoading} className="btn-auth-submit auth-form-item">
              {isLoading
                ? <><span className="spinner-sm" /> {t('register.loading')}</>
                : <>{t('register.submit')} →</>}
            </button>
          </form>

          <div className="auth-divider" />
          <p className="auth-footer">
            {t('register.hasAccount')}{' '}
            <Link to="/login" style={{ fontWeight: 600 }}>{t('register.loginLink')}</Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

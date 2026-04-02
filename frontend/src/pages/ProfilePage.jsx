import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import useAuth from '../hooks/useAuth';
import useTranslation from '../hooks/useTranslation';
import { getErrorMessage } from '../services/api';
import { fetchCurrentUser, updateUserProfile } from '../services/authService';
import { getPublicFileUrl } from '../services/applicationService';

const ProfilePage = () => {
  const { currentUser, isAdmin, updateCurrentUser } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setErrorMessage('');

      try {
        const response = await fetchCurrentUser();
        const user = response.user;

        setFormData((prev) => ({
          ...prev,
          fullName: user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          city: user.city || '',
        }));
        setAvatarPreview(getPublicFileUrl(user.avatarUrl));
        updateCurrentUser(user);
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [updateCurrentUser]);

  useEffect(() => {
    return () => {
      if (avatarFile && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarFile, avatarPreview]);

  const displayedAvatar = useMemo(() => {
    if (removeAvatar) {
      return '';
    }
    return avatarPreview || getPublicFileUrl(currentUser?.avatarUrl);
  }, [avatarPreview, currentUser?.avatarUrl, removeAvatar]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setRemoveAvatar(false);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(null);
    setAvatarPreview('');
    setRemoveAvatar(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.fullName.trim()) {
      setErrorMessage(t('profile.errors.fullName'));
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setErrorMessage(t('profile.errors.passwordMatch'));
      return;
    }

    const payload = new FormData();
    payload.append('fullName', formData.fullName.trim());
    payload.append('phone', formData.phone.trim());
    payload.append('city', formData.city.trim());
    payload.append('currentPassword', formData.currentPassword);
    payload.append('newPassword', formData.newPassword);
    payload.append('removeAvatar', removeAvatar ? 'true' : 'false');

    if (avatarFile) {
      payload.append('avatar', avatarFile);
    }

    setIsSubmitting(true);

    try {
      const response = await updateUserProfile(payload);
      updateCurrentUser(response.user);
      setSuccessMessage(response.message || t('profile.success'));
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        fullName: response.user.fullName || '',
        phone: response.user.phone || '',
        city: response.user.city || '',
      }));
      setAvatarFile(null);
      setRemoveAvatar(false);
      setAvatarPreview(getPublicFileUrl(response.user.avatarUrl));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <>
        <Navbar />
        <LoadingSpinner fullPage text={t('profile.loading')} />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="profile-page-shell">
            <div className="profile-page-header">
              <div>
                <h1 className="dash-hero-title">{t('profile.title')}</h1>
                <p className="dash-hero-sub">{t('profile.subtitle')}</p>
              </div>
              <span className={`navbar-role-badge ${isAdmin ? 'admin' : ''}`}>
                {isAdmin ? t('nav.roleBadge.admin') : t('nav.roleBadge.applicant')}
              </span>
            </div>

            <ErrorMessage message={errorMessage} onDismiss={() => setErrorMessage('')} />

            {successMessage && (
              <div className="alert alert-success">
                <span className="alert-icon">✅</span>
                <span className="alert-text">{successMessage}</span>
                <button className="alert-close" onClick={() => setSuccessMessage('')}>✕</button>
              </div>
            )}

            <div className="profile-layout">
              <aside className="profile-sidebar-card">
                <div className="profile-avatar-frame">
                  {displayedAvatar ? (
                    <img
                      src={displayedAvatar}
                      alt={formData.fullName || t('profile.avatar')}
                      className="profile-avatar-image"
                    />
                  ) : (
                    <div className="profile-avatar-fallback">
                      {(formData.fullName || currentUser?.fullName || '?')
                        .split(' ')
                        .slice(0, 2)
                        .map((item) => item[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="profile-sidebar-meta">
                  <h2>{formData.fullName || t('profile.noName')}</h2>
                  <p>{formData.email}</p>
                </div>

                <label className="btn btn-primary profile-upload-btn">
                  {t('profile.uploadAvatar')}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleAvatarChange}
                    hidden
                  />
                </label>

                {(displayedAvatar || avatarFile) && (
                  <button
                    type="button"
                    className="btn btn-secondary profile-remove-btn"
                    onClick={handleRemoveAvatar}
                  >
                    {t('profile.removeAvatar')}
                  </button>
                )}
              </aside>

              <section className="profile-form-card">
                <form onSubmit={handleSubmit} className="profile-form-grid">
                  <div className="form-group">
                    <label htmlFor="fullName" className="form-label">{t('profile.fullName')}</label>
                    <input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">{t('profile.email')}</label>
                    <input
                      id="email"
                      name="email"
                      value={formData.email}
                      className="form-input"
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">{t('profile.phone')}</label>
                    <input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="city" className="form-label">{t('profile.city')}</label>
                    <input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="currentPassword" className="form-label">{t('profile.currentPassword')}</label>
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword" className="form-label">{t('profile.newPassword')}</label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="confirmPassword" className="form-label">{t('profile.confirmPassword')}</label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="profile-form-actions">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? t('profile.saving') : t('profile.save')}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ProfilePage;

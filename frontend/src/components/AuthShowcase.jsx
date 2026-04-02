import { useEffect, useState } from 'react';
import useTranslation from '../hooks/useTranslation';

const TYPING_INTERVAL = 90;
const HOLD_INTERVAL = 1800;

const AuthShowcase = ({
  badge,
  title,
  description,
  features,
  accentWords = [],
  statItems = [],
}) => {
  const { t } = useTranslation();
  const [wordIndex, setWordIndex] = useState(0);
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    if (!accentWords.length) {
      return undefined;
    }

    const currentWord = accentWords[wordIndex] || '';
    let timeoutId;

    if (typedText !== currentWord) {
      timeoutId = window.setTimeout(() => {
        setTypedText(currentWord.slice(0, typedText.length + 1));
      }, TYPING_INTERVAL);
    } else {
      timeoutId = window.setTimeout(() => {
        setTypedText('');
        setWordIndex((prev) => (prev + 1) % accentWords.length);
      }, HOLD_INTERVAL);
    }

    return () => window.clearTimeout(timeoutId);
  }, [accentWords, typedText, wordIndex]);

  return (
    <div className="auth-hero-content">
      <div className="auth-hero-brand">
        <span className="auth-hero-icon">🏛️</span>
        <span className="auth-hero-brand-text">{t('nav.brand')}</span>
      </div>

      <div className="auth-hero-badge auth-hero-reveal auth-hero-reveal-1">{badge}</div>

      <div className="auth-hero-kicker auth-hero-reveal auth-hero-reveal-2">
        <span className="auth-hero-kicker-dot" />
        <span>{t('auth.motionLabel')}</span>
      </div>

      <h1 className="auth-hero-title auth-hero-reveal auth-hero-reveal-3">{title}</h1>

      <div className="auth-hero-typing auth-hero-reveal auth-hero-reveal-4">
        <span className="auth-hero-typing-prefix">{t('auth.typingPrefix')}</span>
        <span className="auth-hero-typing-word">{typedText || '\u00A0'}</span>
        <span className="auth-hero-caret" />
      </div>

      <p className="auth-hero-desc auth-hero-reveal auth-hero-reveal-5">{description}</p>

      <div className="auth-hero-features auth-hero-reveal auth-hero-reveal-6">
        {features.map((feature, index) => (
          <div key={`${feature.text}-${index}`} className="auth-hero-feature">
            <div className="auth-hero-feature-icon">{feature.icon}</div>
            <div className="auth-hero-feature-text">
              <strong>{feature.text}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="auth-hero-stats auth-hero-reveal auth-hero-reveal-7">
        {statItems.map((item, index) => (
          <div key={`${item.value}-${index}`} className="auth-hero-stat-card">
            <span className="auth-hero-stat-value">{item.value}</span>
            <span className="auth-hero-stat-label">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="auth-hero-scene" aria-hidden="true">
        <div className="auth-float-card auth-float-card-1">
          <span className="auth-float-card-icon">📄</span>
          <div>
            <strong>{t('auth.scene.card1Title')}</strong>
            <span>{t('auth.scene.card1Text')}</span>
          </div>
        </div>

        <div className="auth-float-card auth-float-card-2">
          <span className="auth-float-card-icon">✨</span>
          <div>
            <strong>{t('auth.scene.card2Title')}</strong>
            <span>{t('auth.scene.card2Text')}</span>
          </div>
        </div>

        <div className="auth-float-card auth-float-card-3">
          <span className="auth-float-card-icon">🔔</span>
          <div>
            <strong>{t('auth.scene.card3Title')}</strong>
            <span>{t('auth.scene.card3Text')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthShowcase;

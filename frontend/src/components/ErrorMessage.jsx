import useTranslation from '../hooks/useTranslation';

// Қате хабарламасы компоненті
// Пайдаланушыға қате туралы ақпаратты визуалды түрде көрсетеді
const ErrorMessage = ({ message, onDismiss }) => {
  const { t } = useTranslation();

  if (!message) return null;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 16px',
        backgroundColor: 'var(--error-bg)',
        border: '1px solid var(--error-border)',
        borderRadius: 'var(--r-sm)',
        marginBottom: 'var(--sp-4)',
        fontSize: '0.875rem',
        color: 'var(--error-text)',
        lineHeight: '1.5',
      }}
    >
      {/* Қате иконы */}
      <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}>⚠️</span>

      {/* Қате мәтіні */}
      <span style={{ flex: 1 }}>{message}</span>

      {/* Жабу батырмасы (опционал) */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label={t('common.close')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--error-text)',
            fontSize: '1rem',
            padding: '0',
            flexShrink: 0,
            lineHeight: 1,
            opacity: 0.7,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;

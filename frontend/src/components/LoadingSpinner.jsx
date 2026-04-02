import { getCommonMessage, getStoredLanguage } from '../utils/localization';

// Жүктелу индикаторы — барлық async әрекеттерде пайдаланылады
const LoadingSpinner = ({
  text = getCommonMessage(getStoredLanguage(), 'loading'),
  fullPage = false,
}) => {
  const spinnerContent = (
    <div className="page-loader">
      {/* CSS анимациясы арқылы айнымалы шеңбер */}
      <div style={spinnerStyle} />
      <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>{text}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

// Inline стиль — сыртқы CSS файлына тәуелді емес
const spinnerStyle = {
  width: '40px',
  height: '40px',
  border: '3px solid var(--gray-200)',
  borderTopColor: 'var(--primary)',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
};

// Анимацияны <style> тегі арқылы қосамыз (бір рет енгізіледі)
if (typeof document !== 'undefined' && !document.getElementById('spinner-style')) {
  const style = document.createElement('style');
  style.id = 'spinner-style';
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}

export default LoadingSpinner;

import { createContext, useState, useCallback, useEffect } from 'react';
import kk from '../locales/kk';
import ru from '../locales/ru';

// Қолдау көрсетілетін тілдер
export const LANGUAGES = {
  kk: { code: 'kk', label: 'ҚАЗ', flag: '🇰🇿', translations: kk },
  ru: { code: 'ru', label: 'РУС', flag: '🇷🇺', translations: ru },
};

export const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  // localStorage-тен сақталған тілді оқу немесе браузер тілін анықтау
  const detectInitialLanguage = () => {
    const saved = localStorage.getItem('lang');
    if (saved && LANGUAGES[saved]) return saved;
    const browser = navigator.language?.slice(0, 2);
    return browser === 'ru' ? 'ru' : 'kk';
  };

  const [language, setLanguage] = useState(detectInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Тілді ауыстыру
  const switchLanguage = useCallback((lang) => {
    if (!LANGUAGES[lang]) return;
    setLanguage(lang);
    localStorage.setItem('lang', lang);
  }, []);

  // Ағымдағы аударма объектісі
  const translations = LANGUAGES[language].translations;

  // t(key) — нүкте арқылы кірістірілген кілтке қол жеткізу
  // Мысал: t('nav.brand'), t('login.title')
  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      if (value == null) return key;
      value = value[k];
    }

    if (value == null) return key;

    // {{param}} орын басушыларын ауыстыру
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return Object.entries(params).reduce(
        (str, [param, replacement]) => str.replace(`{{${param}}}`, replacement),
        value
      );
    }

    return value;
  }, [translations]);

  return (
    <LanguageContext.Provider value={{ language, switchLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

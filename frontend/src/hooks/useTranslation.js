import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';

// Аударма хуки — барлық компоненттерде t() функциясына қол жеткізеді
// Мысал: const { t, language, switchLanguage } = useTranslation();
const useTranslation = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useTranslation хуки LanguageProvider ішінде пайдаланылуы керек.');
  }

  return context;
};

export default useTranslation;

import axios from 'axios';
import {
  getCommonMessage,
  getStoredLanguage,
  localizeBackendMessage,
} from '../utils/localization';

// Базалық URL анықтауы:
// — Даму (localhost): Vite proxy арқылы '/api' → localhost:5000
// — Өндіріс (Vercel): VITE_API_URL айнымалысы → Render backend URL
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

// Axios негізгі данасы — барлық API сұраныстары осы арқылы өтеді
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 секунд күту
});

// ─────────────────────────────────────────────
// Сұраныс интерцепторы — JWT токенін автоматты қосады
// ─────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
// Жауап интерцепторы — 401 қатесін өңдейді
// Токен мерзімі өтсе — пайдаланушыны шығарады
// ─────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен жарамсыз немесе мерзімі өткен — сессияны тазалаймыз
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Кіру бетіне бағыттаймыз
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Серверден қайтарылған қате хабарламасын алу көмекші функциясы
export const getErrorMessage = (error) => {
  const language = getStoredLanguage();

  if (error.response?.data?.message) {
    return localizeBackendMessage(error.response.data.message, language);
  }
  if (error.message === 'Network Error') {
    return getCommonMessage(language, 'networkError');
  }
  if (error.code === 'ECONNABORTED') {
    return getCommonMessage(language, 'timeoutError');
  }
  return getCommonMessage(language, 'unknownError');
};

export default api;

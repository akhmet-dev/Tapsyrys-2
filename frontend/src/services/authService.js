import api from './api';

// ─────────────────────────────────────────────
// Аутентификация сервисі
// Тіркелу, кіру, профиль алу функциялары
// ─────────────────────────────────────────────

/**
 * Жаңа пайдаланушыны тіркеу
 * @param {Object} credentials - { fullName, email, password }
 * @returns {Object} - { token, user }
 */
export const registerUser = async (credentials) => {
  const response = await api.post('/auth/register', credentials);
  return response.data;
};

/**
 * Жүйеге кіру
 * @param {Object} credentials - { email, password }
 * @returns {Object} - { token, user }
 */
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

/**
 * Ағымдағы пайдаланушының профилін алу
 * @returns {Object} - { user }
 */
export const fetchCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * Ағымдағы пайдаланушы профилін жаңарту
 * @param {Object|FormData} profileData
 * @returns {Object} - { user }
 */
export const updateUserProfile = async (profileData) => {
  const isFormData = profileData instanceof FormData;
  const response = await api.put('/auth/profile', profileData, isFormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined);
  return response.data;
};

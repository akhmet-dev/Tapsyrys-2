import api from './api';

// ─────────────────────────────────────────────
// Өтінімдер сервисі — толық CRUD операциялары
// ─────────────────────────────────────────────

/**
 * Барлық өтінімдерді алу
 * Абитуриент — өзінікін, Админ — барлығын алады
 * @returns {Array} - өтінімдер тізімі
 */
export const fetchApplications = async () => {
  const response = await api.get('/applications');
  return response.data;
};

/**
 * Жеке өтінімді ID бойынша алу
 * @param {string} applicationId
 * @returns {Object} - өтінім деректері
 */
export const fetchApplicationById = async (applicationId) => {
  const response = await api.get(`/applications/${applicationId}`);
  return response.data;
};

/**
 * Админ үшін өтінімнің толық профилін алу
 * @param {string} applicationId
 * @returns {Object} - пайдаланушы, өтінім, құжаттар, тарих, хабарламалар
 */
export const fetchAdminApplicationFull = async (applicationId) => {
  const response = await api.get(`/admin/applications/${applicationId}/full`);
  return response.data;
};

/**
 * Жаңа өтінім жасау
 * @param {Object} applicationData - { faculty, speciality, entExamScore, studyType, fundingType }
 * @returns {Object} - жасалған өтінім
 */
export const createApplication = async (applicationData) => {
  const isFormData = applicationData instanceof FormData;
  const response = await api.post('/applications', applicationData, isFormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined);
  return response.data;
};

/**
 * Өтінімді жаңарту
 * @param {string} applicationId
 * @param {Object} updateData
 * @returns {Object} - жаңартылған өтінім
 */
export const updateApplication = async (applicationId, updateData) => {
  const isFormData = updateData instanceof FormData;
  const response = await api.put(`/applications/${applicationId}`, updateData, isFormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined);
  return response.data;
};

/**
 * Өтінімнің статусын өзгерту (тек Админ)
 * @param {string} applicationId
 * @param {string} status - 'күтілуде' | 'қабылданды' | 'қабылданбады'
 * @param {string} adminNote - қосымша ескертпе
 * @returns {Object} - жаңартылған өтінім
 */
export const updateApplicationStatus = async (applicationId, status, adminNote = '') => {
  const response = await api.patch(`/applications/${applicationId}/status`, {
    status,
    adminNote,
  });
  return response.data;
};

/**
 * Өтінімді жою
 * @param {string} applicationId
 * @returns {Object} - сәттілік хабарламасы
 */
export const deleteApplication = async (applicationId) => {
  const response = await api.delete(`/applications/${applicationId}`);
  return response.data;
};

/**
 * Өтінімге құжат жүктеу (multipart/form-data)
 * @param {string} applicationId
 * @param {File}   file     - жүктелетін файл
 * @param {string} docName  - құжат атауы (мысалы: "Жеке куәлік")
 * @returns {Object} - жүктелген құжат деректері
 */
export const uploadDocument = async (applicationId, file, docName) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', docName);
  const response = await api.post(`/applications/${applicationId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Өтінімнен құжатты жою
 * @param {string} applicationId
 * @param {string} docId - жойылатын құжаттың ID-сі
 * @returns {Object} - сәттілік хабарламасы
 */
export const deleteDocument = async (applicationId, docId) => {
  const response = await api.delete(`/applications/${applicationId}/documents/${docId}`);
  return response.data;
};

/**
 * Рейтинг тізімін алу (ашық)
 * @returns {Array} - рейтинг тізімі
 */
export const fetchRating = async () => {
  const response = await api.get('/rating');
  return response.data;
};

/**
 * Аналитика деректерін алу (тек Админ)
 * @returns {Object} - статистика деректері
 */
export const fetchAnalytics = async () => {
  const response = await api.get('/admin/analytics');
  return response.data;
};

/**
 * Өтінімнің PDF файлын жүктеу (blob ретінде)
 * @param {string} applicationId
 */
export const downloadApplicationPDF = async (applicationId) => {
  const response = await api.get(`/applications/${applicationId}/pdf`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `application-${applicationId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Сервердегі файлға жария сілтеме жасау
 * @param {string} fileUrl
 * @returns {string}
 */
export const getPublicFileUrl = (fileUrl = '') => {
  if (!fileUrl) {
    return '';
  }

  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl;
  }

  if (!import.meta.env.VITE_API_URL) {
    if (typeof window === 'undefined') {
      return fileUrl;
    }

    const backendOrigin = `${window.location.protocol}//${window.location.hostname}:5001`;
    const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    return `${backendOrigin}${normalizedPath}`;
  }

  const publicOrigin = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  return `${publicOrigin}${normalizedPath}`;
};

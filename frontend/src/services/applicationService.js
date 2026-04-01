import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const getApplications = () =>
  axios.get(`${API_URL}/api/applications`, { headers: getAuthHeaders() })

export const getApplication = (id) =>
  axios.get(`${API_URL}/api/applications/${id}`, { headers: getAuthHeaders() })

export const createApplication = (data) =>
  axios.post(`${API_URL}/api/applications`, data, { headers: getAuthHeaders() })

export const updateApplication = (id, data) =>
  axios.put(`${API_URL}/api/applications/${id}`, data, { headers: getAuthHeaders() })

export const deleteApplication = (id) =>
  axios.delete(`${API_URL}/api/applications/${id}`, { headers: getAuthHeaders() })

// POST /api/applications/:id/documents  ← correct plural "documents"
export const uploadDocument = (id, file) => {
  const formData = new FormData()
  formData.append('document', file)
  return axios.post(`${API_URL}/api/applications/${id}/documents`, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  })
}

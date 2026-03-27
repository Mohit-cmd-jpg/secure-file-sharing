import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// Auth APIs
export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const deleteAccount = () => api.delete('/auth/account')

// File APIs
export const uploadFile = (formData) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
})
export const getMyFiles = () => api.get('/files/my-files')
export const getSharedFiles = () => api.get('/files/shared')
export const getFileById = (id) => api.get(`/files/${id}`)
export const shareFile = (data) => api.post('/files/share', data)
export const deleteFile = (id) => api.delete(`/files/${id}`)
export const revokeAccess = (data) => api.delete('/files/revoke', { data })

export default api

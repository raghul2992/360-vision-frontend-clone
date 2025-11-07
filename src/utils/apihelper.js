import axios from 'axios'
import Cookies from 'js-cookie'

const API_BASE_URL = process.env.REACT_APP_BASE_URL

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
})

api.interceptors.request.use(
  config => {
    config.headers['ngrok-skip-browser-warning'] = 'true'
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// ✅ Response Interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.warn('⚠️ Unauthorized (401) - Logging out...')

      // Optionally redirect to login page
      window.location.href = '/'
    }

    return Promise.reject(error)
  }
)

export default api

import axios from 'axios'
import Cookies from 'js-cookie'

const API_BASE_URL = process.env.REACT_APP_BASE_URL

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

api.interceptors.request.use(
  (config) => {
    config.headers['ngrok-skip-browser-warning'] = 'true'
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default api
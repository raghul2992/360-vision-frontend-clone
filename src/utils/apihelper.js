import axios from 'axios'
import Cookies from 'js-cookie'
import { toast, ToastContainer } from 'react-toastify'

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
  error => Promise.reject(error)
)

// ✅ Response Interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const { status, data } = error.response
      console.log('Server Error Body:', data)
      console.log(error)
      if (status === 401) {
        console.warn('⚠️ Unauthorized (401) - Logging out...')
        window.location.href = '/'
      }

      if (status === 429) {
        toast.warning(
          'Too many requests. Please wait a moment and try again.',
          {
            position: 'top-right',
            autoClose: 4000,
            pauseOnHover: true
          }
        )
      }
    }
    console.log(error)
    // toast.error(error.message, {
    //   position: 'top-right',
    //   autoClose: 4000,
    //   pauseOnHover: true
    // })
    return Promise.reject(error)
  }
)

export default api

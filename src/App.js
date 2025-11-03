import './App.css'
import {
  BrowserRouter as Router,
  useLocation,
  useRoutes
} from 'react-router-dom'
import { routes } from './route'
import FloatingLanguageButton from './component/FloatingLanguageButton'
import { Provider, useSelector, useDispatch } from 'react-redux'
import store from './app/store'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import React, { useEffect, useState } from 'react'
import useWebSocket from './hooks/useWebSocket'
import {
  handleWebSocketMessage,
  setWsConnected,
  setWsError
} from './features/alert/alertsslice'
import { getCameras } from './features/cameras/cameraApiSlice' // Import getCameras from cameraApiSlice
import {
  addNotification,
  fetchNotifications
} from './features/notification/notificationSlice' // Import addNotification and fetchNotifications
import { logoutUser } from './features/auth/authSlice'

function AppRoutes () {
  const element = useRoutes(routes)
  return element
}

function App () {
  return (
    <Provider store={store}>
      <div className='font-sans'>
        <Router>
          <ToastContainer />
          <MainApp />
        </Router>
      </div>
    </Provider>
  )
}

function MainApp () {
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const [websocketUrl, setWebsocketUrl] = useState(null)

  useEffect(() => {
    const tenantId = localStorage.getItem('tenant_id')
    if (tenantId && user) {
      const baseUrl = process.env.REACT_APP_BASE_URL
      const websocketBaseUrl = baseUrl
      setWebsocketUrl(`${websocketBaseUrl}/ws/${tenantId}`)
    } else {
      setWebsocketUrl(null) // Close WebSocket on logout
    }
  }, [user])

  const {
    isConnected,
    message: wsMessage,
    error: wsError
  } = useWebSocket(websocketUrl)

  useEffect(() => {
    dispatch(setWsConnected(isConnected))
  }, [isConnected, dispatch])

  useEffect(() => {
    if (wsError) {
      console.error('WebSocket connection error:', wsError)
      dispatch(setWsError(wsError.message))
      // Optionally, dispatch logout if WebSocket error is critical
      // dispatch(logoutUser());
    }
  }, [wsError, dispatch])

  useEffect(() => {
    if (wsMessage) {
      dispatch(handleWebSocketMessage(wsMessage))
      if (wsMessage.type === 'camera_status') {
        const tenantId = localStorage.getItem('tenant_id')
        if (tenantId) {
          dispatch(getCameras({ tenantId }))
          dispatch(fetchNotifications({ tenantId })) // Also fetch notifications
        }
      } else if (wsMessage.type === 'event_alert') {
        dispatch(addNotification(wsMessage.data))
      }
    }
  }, [wsMessage, dispatch])

  // Hide the Floating Button on ALL dashboard-related routes
  const dashboardPaths = [
    '/admin-dashboard',
    '/camera',
    '/add-camera',
    '/roi-configuration'
  ]

  const hideFloatingButton = dashboardPaths.some(path =>
    location.pathname.startsWith(path)
  )

  return (
    <>
      <AppRoutes />
      {!hideFloatingButton && <FloatingLanguageButton />}
    </>
  )
}

export default App

import './App.css'
import {
  BrowserRouter as Router,
  useLocation,
  useRoutes
} from 'react-router-dom'
import { routes } from './route'
import FloatingLanguageButton from './component/FloatingLanguageButton'
import AlertPopup from './component/AlertPopup'
import { Provider, useSelector, useDispatch } from 'react-redux'
import eventEmitter from './utils/eventEmitter'
import store from './app/store'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import React, { useEffect, useState, useCallback } from 'react'
import useWebSocket from './hooks/useWebSocket'
import { getCameras } from './features/cameras/cameraApiSlice'
import {
  fetchNotifications,
  addNotification
} from './features/notification/notificationSlice'
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
  const [notificationPermission, setNotificationPermission] = useState(
    Notification.permission
  )
  const [alertData, setAlertData] = useState(null) // store alert popup data

  const {
    isConnected,
    message: wsMessage,
    error: wsError
  } = useWebSocket(websocketUrl, localStorage.getItem('tenant_id'))

  // --- Set WebSocket URL ---

  // --- Notification permission listener ---
  const handlePermissionChange = useCallback(() => {
    setNotificationPermission(Notification.permission)
  }, [])

  useEffect(() => {
    navigator.permissions
      ?.query({ name: 'notifications' })
      .then(permissionStatus => {
        permissionStatus.onchange = handlePermissionChange
      })
    return () => {
      navigator.permissions
        ?.query({ name: 'notifications' })
        .then(permissionStatus => {
          permissionStatus.onchange = null
        })
    }
  }, [handlePermissionChange])

  // --- WebSocket Error Logging ---
  useEffect(() => {
    if (wsError) console.error('WebSocket connection error:', wsError)
  }, [wsError])

  // --- Request browser notification permission ---
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications')
      return
    }
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
    }
  }, [])

  useEffect(() => {
    requestNotificationPermission()
  }, [requestNotificationPermission])

  // --- Handle WebSocket messages ---
  useEffect(() => {
    if (!wsMessage) return

    const tenantId = localStorage.getItem('tenant_id')

    if (wsMessage.type === 'camera_status' && tenantId) {
      dispatch(getCameras({ tenantId }))
      if (Notification.permission === 'granted') {
        new Notification('Camera Status Update', {
          body: `Camera ${wsMessage.data.camera_id} status changed to ${wsMessage.data.status}`,
          icon: '/favicon.ico'
        })
      }
      setAlertData(wsMessage.data)
      dispatch(
        addNotification({
          title: 'Camera Status Update',
          message: `Camera ${wsMessage.data.camera_id} status changed to ${wsMessage.data.status}`,
          type: 'camera_status',
          meta: wsMessage.data
        })
      )
    } else if (wsMessage.type === 'event_alert') {
      // Set alert popup data
      setAlertData(wsMessage.data)
      dispatch(
        addNotification({
          title: wsMessage.data.title || 'New Alert',
          message: wsMessage.data.message,
          type: 'event_alert',
          meta: wsMessage.data
        })
      )

      // Also show system notification
      if (Notification.permission === 'granted') {
        new Notification(wsMessage.data.title || 'New Alert', {
          body: wsMessage.data.message,
          icon: '/logo192.png'
        })
      }
    }
  }, [wsMessage, dispatch, alertData])

  // --- Handle close of AlertPopup ---
  const handleCloseAlert = useCallback(() => {
    setAlertData(null)
  }, [])

  // --- Hide Floating Button on specific pages ---
  const dashboardPaths = [
    '/dashboard',
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

      {/* Show popup only when WebSocket alert arrives */}
      {/* <AlertPopup /> */}

      {!hideFloatingButton && <FloatingLanguageButton />}

      {notificationPermission === 'denied' && (
        <div className='fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-md shadow-lg z-50'>
          Notifications are blocked. Please enable them in your browser settings
          to receive alerts.
        </div>
      )}
    </>
  )
}

export default App

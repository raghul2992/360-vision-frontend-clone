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
import 'react-toastify/dist/ReactToastify.css'
import React, { useEffect, useState, useCallback } from 'react'
import useWebSocket from './hooks/useWebSocket'
import { getCameras } from './features/cameras/cameraApiSlice'
import { logoutUser } from './features/auth/authSlice'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function AppRoutes () {
  const element = useRoutes(routes)
  return element
}

function App () {
  return (
    <Provider store={store}>
      <div className='font-sans'>
        <ToastContainer
          position='bottom-right'
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme='colored'
        />
        <Router>
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

  const {
    isConnected,
    message: wsMessage,
    error: wsError
  } = useWebSocket(websocketUrl, localStorage.getItem('tenant_id'))

  // ----------------------------------
  // FIX: Show "notifications blocked" ONLY ONCE
  // ----------------------------------

  const LOCAL_STORAGE_KEY = 'notif_permission_denied_shown'

  const showPermissionDeniedToast = () => {
    toast.warn(
      <div>
        <p className='font-semibold'>Notifications are blocked</p>
        <p className='text-sm mt-1'>
          Please enable notifications in your browser settings to receive
          alerts.
        </p>
        <button
          onClick={() => {
            window.open(
              'https://support.google.com/chrome/answer/3220216',
              '_blank'
            )
            toast.dismiss()
          }}
          className='mt-2 text-sm underline text-blue-400 hover:text-white'
        >
          How to enable notifications
        </button>
      </div>,
      {
        position: 'top-right',
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        theme: 'colored',
        toastId: 'notification-permission-denied'
      }
    )
  }

  useEffect(() => {
    const alreadyShown = localStorage.getItem(LOCAL_STORAGE_KEY)

    // Show only ONCE
    if (Notification.permission === 'denied' && !alreadyShown) {
      setTimeout(() => {
        showPermissionDeniedToast()
        localStorage.setItem(LOCAL_STORAGE_KEY, 'true')
      }, 800)
    }

    navigator.permissions
      ?.query({ name: 'notifications' })
      .then(permissionStatus => {
        permissionStatus.onchange = () => {
          const newPermission = Notification.permission

          if (
            newPermission === 'denied' &&
            !localStorage.getItem(LOCAL_STORAGE_KEY)
          ) {
            showPermissionDeniedToast()
            localStorage.setItem(LOCAL_STORAGE_KEY, 'true')
          }
        }
      })

    return () => {
      navigator.permissions
        ?.query({ name: 'notifications' })
        .then(permissionStatus => {
          permissionStatus.onchange = null
        })
    }
  }, [])

  // Request permission if needed
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // ----------------------------------
  // WebSocket Message Handler
  // ----------------------------------
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
    } else if (wsMessage.type === 'event_alert') {
      if (Notification.permission === 'granted') {
        new Notification(wsMessage.data.title || 'New Alert', {
          body: wsMessage.data.message,
          icon: '/logo192.png'
        })
      }
    }
  }, [wsMessage])

  // Hide Floating Button on dashboard-like screens
  const dashboardPaths = [
    '/dashboard',
    '/camera',
    '/add-camera',
    '/roi-configuration',
    '/location'
  ]
  const hideFloatingButton = dashboardPaths.some(path =>
    location.pathname.startsWith(path)
  )

  return (
    <>
      <AppRoutes />

      <AlertPopup />

      {!hideFloatingButton && <FloatingLanguageButton />}
    </>
  )
}

export default App

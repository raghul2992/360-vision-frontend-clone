import './App.css'
import React, { useEffect, useState, useCallback } from 'react'
import {
  BrowserRouter as Router,
  useLocation,
  useRoutes
} from 'react-router-dom'
import { routes } from './route'
import FloatingLanguageButton from './component/FloatingLanguageButton'
import AlertPopup from './component/AlertPopup'
import { useSelector, useDispatch } from 'react-redux' // Removed Provider from here (it's in index.js)
import store from './app/store'
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
    // <Provider> is removed here because it is already in index.js
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
  )
}

function MainApp () {
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const [websocketUrl, setWebsocketUrl] = useState(null)

  // FIX 1: Safely initialize state
  const [notificationPermission, setNotificationPermission] = useState(
    'Notification' in window ? Notification.permission : 'default'
  )

  const {
    isConnected,
    message: wsMessage,
    error: wsError
  } = useWebSocket(websocketUrl, localStorage.getItem('tenant_id'))

  // ----------------------------------
  // Helper: Toast for Blocked Permissions
  // ----------------------------------
  const LOCAL_STORAGE_KEY = 'notif_permission_denied_shown'

  const showPermissionDeniedToast = useCallback(() => {
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
  }, [])

  // ----------------------------------
  // Permission Logic (Safe for iOS)
  // ----------------------------------
  useEffect(() => {
    // FIX 2: Check existence before checking permission property
    if (!('Notification' in window)) return

    const alreadyShown = localStorage.getItem(LOCAL_STORAGE_KEY)

    // Show only ONCE
    if (Notification.permission === 'denied' && !alreadyShown) {
      setTimeout(() => {
        showPermissionDeniedToast()
        localStorage.setItem(LOCAL_STORAGE_KEY, 'true')
      }, 800)
    }

    // FIX 3: Add safety check for navigator.permissions
    if ('permissions' in navigator) {
      navigator.permissions
        ?.query({ name: 'notifications' })
        .then(permissionStatus => {
          permissionStatus.onchange = () => {
            // FIX 4: Re-check existence inside callback
            if (!('Notification' in window)) return

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
        .catch(err => {
          // Creating a catch block prevents crash on browsers that don't implement this query
          console.log('Permission query not supported', err)
        })
    }

    return () => {
      if ('permissions' in navigator) {
        navigator.permissions
          ?.query({ name: 'notifications' })
          .then(permissionStatus => {
            permissionStatus.onchange = null
          })
          .catch(() => {})
      }
    }
  }, [showPermissionDeniedToast, LOCAL_STORAGE_KEY])

  // Request permission if needed
  useEffect(() => {
    // FIX 5: Check existence before requesting
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        Notification.requestPermission().catch(err => console.error(err))
      } catch (e) {
        console.error('Failed to request permission', e)
      }
    }
  }, [])

  // ----------------------------------
  // WebSocket Message Handler
  // ----------------------------------
  // useEffect(() => {
  //   if (!wsMessage) return

  //   const tenantId = localStorage.getItem('tenant_id')

  //   // FIX 6: Centralized check for capability
  //   const canNotify =
  //     'Notification' in window && Notification.permission === 'granted'

  //   if (wsMessage.type === 'camera_status' && tenantId) {
  //     dispatch(getCameras({ tenantId }))

  //     if (canNotify) {
  //       try {
  //         new Notification('Camera Status Update', {
  //           body: `Camera ${wsMessage.data.camera_id} status changed to ${wsMessage.data.status}`,
  //           icon: '/favicon.ico'
  //         })
  //       } catch (e) {
  //         console.error('Notification creation failed', e)
  //       }
  //     }
  //   } else if (wsMessage.type === 'event_alert') {
  //     if (canNotify) {
  //       try {
  //         new Notification(wsMessage.data.title || 'New Alert', {
  //           body: wsMessage.data.message,
  //           icon: '/sstlogo.png'
  //         })
  //       } catch (e) {
  //         console.error('Notification creation failed', e)
  //       }
  //     }
  //   }
  // }, [wsMessage, dispatch])

  // Hide Floating Button on dashboard-like screens
  const dashboardPaths = [
    '/dashboard',
    '/camera',
    '/add-camera',
    '/roi-configuration',
    '/location',
    '/user-management'
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

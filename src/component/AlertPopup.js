// hooks/useWebSocket.js
import { useState, useEffect, useRef, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { updateCameraStatusFromWebSocket } from '../features/cameras/cameraApiSlice'
import {
  addNotification,
  removeNotification
} from '../features/notification/notificationSlice'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useTranslation } from 'react-i18next'

// ✅ Inline Custom Toast UI (from AlertPopup)
const CustomAlertToast = ({ alert, t }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const toggleExpand = () => setIsExpanded(!isExpanded)
  const isCameraStatus = alert.type === 'camera_status'

  return (
    <div
      onClick={toggleExpand}
      style={{
        cursor: 'pointer',
        padding: '10px',
        borderRadius: '8px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
      }}
    >
      <h4 style={{ marginBottom: '4px', fontWeight: 600 }}>
        {isCameraStatus
          ? t('alerts.camera_status')
          : alert.title || t('alerts.alert')}
      </h4>
      <p style={{ marginBottom: '4px' }}>{alert.message}</p>

      {isExpanded && !isCameraStatus && alert.meta && (
        <div style={{ marginTop: '6px', fontSize: '0.9rem', color: '#333' }}>
          {alert.meta.camera_name && (
            <p>
              {t('alerts.camera')}: {alert.meta.camera_name}
            </p>
          )}
          {alert.meta.roi_name && (
            <p>
              {t('alerts.region')}: {alert.meta.roi_name}
            </p>
          )}
          {alert.meta.detection_type && (
            <p>
              {t('alerts.type')}: {alert.meta.detection_type}
            </p>
          )}
          {alert.meta.confidence_score && (
            <p>
              {t('alerts.confidence')}: {alert.meta.confidence_score}
            </p>
          )}
          {alert.created_at && (
            <p>
              {t('alerts.created_at')}:{' '}
              {new Date(alert.created_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
      <small style={{ color: '#666' }}>
        {isExpanded
          ? t('alerts.click_to_collapse')
          : t('alerts.click_to_expand')}
      </small>
    </div>
  )
}

const useWebSocket = (url, reconnectInterval = 2000) => {
  const [isConnected, setIsConnected] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const ws = useRef(null)
  const reconnectTimeout = useRef(null)
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const connect = useCallback(() => {
    if (!url) {
      console.log('No WebSocket URL provided')
      return
    }

    if (
      ws.current &&
      (ws.current.readyState === WebSocket.OPEN ||
        ws.current.readyState === WebSocket.CONNECTING)
    ) {
      console.log('WebSocket already connected or connecting')
      return
    }

    console.log(`Attempting to connect to WebSocket: ${url}`)
    ws.current = new WebSocket(url)

    ws.current.onopen = () => {
      console.log('WebSocket connected!')
      setIsConnected(true)
      setError(null)
      clearTimeout(reconnectTimeout.current)
    }

    ws.current.onmessage = event => {
      try {
        const receivedMessage = JSON.parse(event.data)
        console.log('Received WebSocket message:', receivedMessage)
        setMessage(receivedMessage)

        if (receivedMessage.type === 'camera_status') {
          dispatch(updateCameraStatusFromWebSocket(receivedMessage.data))
          const alert = {
            id: Date.now(),
            title: 'Camera Status Update',
            message: `Camera ${receivedMessage.data.camera_id} status changed to ${receivedMessage.data.status}`,
            type: 'camera_status',
            meta: receivedMessage.data
          }
          dispatch(addNotification(alert))
          toast.info(<CustomAlertToast alert={alert} t={t} />, {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            onClose: () => dispatch(removeNotification(alert.id))
          })
        } else if (receivedMessage.type === 'event_alert') {
          const alert = {
            id: Date.now(),
            title: receivedMessage.data.title || 'Event Alert',
            message: receivedMessage.data.message || 'New event alert received',
            type: 'event_alert',
            meta: receivedMessage.data
          }
          dispatch(addNotification(alert))
          toast.info(<CustomAlertToast alert={alert} t={t} />, {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            onClose: () => dispatch(removeNotification(alert.id))
          })
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e)
        setMessage(event.data)
      }
    }

    ws.current.onclose = event => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      setIsConnected(false)
      setError(`Disconnected: ${event.reason || 'Unknown reason'}`)
      reconnectTimeout.current = setTimeout(connect, reconnectInterval)
    }

    ws.current.onerror = err => {
      console.error('WebSocket error:', err)
      setIsConnected(false)
      setError(err.message || 'WebSocket error occurred')
      if (ws.current) ws.current.close()
    }
  }, [url, reconnectInterval, dispatch, t])

  useEffect(() => {
    connect()
    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close()
      }
      clearTimeout(reconnectTimeout.current)
    }
  }, [url, connect])

  const sendMessage = useCallback(data => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', data)
      ws.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not open:', ws.current?.readyState)
    }
  }, [])

  return { isConnected, message, error, sendMessage, connect }
}

export default useWebSocket

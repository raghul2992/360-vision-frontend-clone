import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useTranslation } from 'react-i18next'
import { removeAlert } from '../features/alert/alertSlice'

const CustomAlertToast = ({ alert, t, onClose }) => {
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
      {/* 
      <small style={{ color: '#666' }}>
        {isExpanded
          ? t('alerts.click_to_collapse')
          : t('alerts.click_to_expand')}
      </small> */}
    </div>
  )
}

const AlertPopup = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const alerts = useSelector(state => state.alerts.alerts)

  useEffect(() => {
    alerts.forEach(alert => {
      // ✅ ONLY allow popup for camera_status
      if (alert.type !== 'camera_status') return

      if (!toast.isActive(alert.id)) {
        toast.info(
          <CustomAlertToast
            alert={alert}
            t={t}
            onClose={() => dispatch(removeAlert(alert.id))}
          />,
          {
            toastId: alert.id,
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            onClose: () => dispatch(removeAlert(alert.id))
          }
        )
      }
    })
  }, [alerts, dispatch, t])

  return <ToastContainer />
}

export default AlertPopup

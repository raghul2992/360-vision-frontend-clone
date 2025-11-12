import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { updateAlertAPI } from '../../features/alert/alertSlice'
import { getRois } from '../../features/cameras/roilistslice'
import { IoAddCircleOutline, IoRemove, IoCallOutline } from 'react-icons/io5'
import { useTranslation } from 'react-i18next'
import { formatDateTime } from '../../utils/datehelper'
import CallPopup from '../../component/CallPopup'

const AlertItem = ({ alert, tenantId }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isRead, setIsRead] = useState(
    alert.is_read === true || alert.is_read === 'true'
  )
  const [showCallPopup, setShowCallPopup] = useState(false)
  const [callRecipients, setCallRecipients] = useState([])

  const getPriorityBorderColor = priority => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'border-red-500'
      case 'medium':
        return 'border-yellow-400'
      case 'low':
        return 'border-green-400'
      default:
        return 'border-gray-300'
    }
  }

  const toggleExpand = async () => {
    const newExpand = !isExpanded
    setIsExpanded(newExpand)

    // ✅ mark as read if unread
    if (!isRead) {
      dispatch(
        updateAlertAPI({
          tenantId,
          alertId: alert.id,
          data: { is_read: 'true' }
        })
      )
      setIsRead(true)
    }
  }

  // ✅ Show Call Popup (without expanding)
  const handleOpenCallPopup = async alert => {
    try {
      const roiRes = await dispatch(
        getRois({
          tenantId,
          cameraId: alert.camera_id,
          id: alert.meta?.roi_id, // ✅ Fetch only this ROI
          skip: 0,
          limit: 1
        })
      ).unwrap()

      console.log('ROI Response:', roiRes)

      // ROI API can return single object or array
      const roiData = Array.isArray(roiRes) ? roiRes[0] : roiRes

      // ✅ Validate and extract all notification configs (call, whatsapp, email)
      if (roiData && roiData.notification_config) {
        setCallRecipients(roiData.notification_config)
      } else {
        setCallRecipients({})
      }

      setShowCallPopup(true)
    } catch (err) {
      console.error('Error fetching ROI:', err)
      setCallRecipients({})
      setShowCallPopup(true)
    }
  }

  const getPriorityText = priority => {
    const priorityLower = priority?.toLowerCase()
    if (priorityLower === 'high') return t('alerts.high_priority')
    if (priorityLower === 'medium') return t('alerts.medium_priority')
    if (priorityLower === 'low') return t('alerts.low_priority')
    return t('alerts.medium_priority')
  }

  const {
    camera_name = 'N/A',
    roi_name = 'N/A',
    alert_priority,
    confidence_score,
    frame_clip,
    notes
  } = alert.meta || {}

  const FRAME_DIR = `${process.env.REACT_APP_BASE_URL}/api/v1/tenants/${tenantId}/cameras/alert/image`
  const FRAME_URL = `${FRAME_DIR}/${frame_clip}`

  return (
    <>
      {/* Alert Card */}
      <div
        className={`bg-white rounded-full w-full flex flex-col mb-4 hover:shadow-lg transition-shadow ${
          !isRead ? 'border-l-4 border-blue-500' : ''
        }`}
      >
        <div className='flex items-center justify-between px-4 py-3'>
          <div className='flex items-center gap-4 flex-1 min-w-0'>
            <div
              className={`w-12 h-12 rounded-full border-4 ${getPriorityBorderColor(
                alert_priority
              )} flex items-center justify-center flex-shrink-0`}
            >
              <svg
                width='32'
                height='29'
                viewBox='0 0 32 29'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M21.1314 23.9164C21.8193 23.9164 22.4427 23.6338 22.8925 23.1789C23.3424 22.7239 23.6218 22.0935 23.6218 21.3979C23.6218 20.7023 23.3439 20.0719 22.8925 19.6154C22.4411 19.1605 21.8178 18.8779 21.1299 18.8779C20.4421 18.8779 19.8187 19.1589 19.3673 19.6154C18.9174 20.0719 18.638 20.7007 18.638 21.3979C18.638 22.0951 18.9174 22.7239 19.3673 23.1789C19.8172 23.6353 20.4405 23.9164 21.1284 23.9164H21.1314ZM27.904 8.71231L28.38 9.58182C28.6026 9.97621 28.6456 10.4218 28.5381 10.8255C28.4306 11.2323 28.1681 11.6003 27.7781 11.827L20.3499 16.1637L21.4846 18.1512C22.2339 18.2335 22.9079 18.5766 23.413 19.0875C23.5021 19.1775 23.5865 19.2738 23.6648 19.3732H27.0749V17.645C27.0749 16.9277 27.3636 16.2786 27.8288 15.8066C28.2955 15.3361 28.9389 15.0442 29.6451 15.0442H31.0899V28.1289H29.6467C28.9373 28.1289 28.294 27.837 27.8288 27.3665C27.3636 26.896 27.0749 26.2454 27.0749 25.5296V23.8015H23.3148C22.7405 24.3356 21.9728 24.6617 21.1314 24.6617C20.2409 24.6617 19.4333 24.2952 18.8499 23.7052C18.2649 23.1152 17.9025 22.2969 17.9025 21.3963C17.9025 21.1976 17.9194 21.0035 17.9532 20.8141L16.5606 18.3748L8.81617 22.8963C8.42618 23.123 7.98092 23.1695 7.57865 23.0608C7.17638 22.9522 6.8125 22.6866 6.58833 22.2923L6.32271 21.8202L4.36356 22.9661C4.20849 23.0546 4.03499 23.0717 3.87992 23.0298C3.72331 22.9879 3.58052 22.8823 3.493 22.7301L0.0829258 16.7864C-0.00612628 16.6311 -0.0214801 16.4556 0.0199752 16.2973C0.0629658 16.1389 0.165836 15.9929 0.316303 15.9044L1.26363 15.3517L0.44374 14.7834C0.333193 14.7073 0.239534 14.6079 0.176584 14.4915C0.113633 14.3766 0.079855 14.243 0.0813904 14.1017C0.0844611 13.9589 0.122846 13.8238 0.188867 13.7074C0.256424 13.5893 0.354688 13.49 0.475983 13.4201L23.0906 0.222117C23.479 -0.00613033 23.9258 -0.0527115 24.3296 0.0559779C24.7334 0.164667 25.0973 0.43018 25.3215 0.823014L28.5289 6.4407C28.7531 6.83509 28.7991 7.28692 28.6917 7.69528C28.5842 8.10365 28.3216 8.47008 27.9332 8.69678L27.9055 8.71231H27.904Z'
                  fill='#393A4A'
                />
              </svg>
            </div>

            <div className='flex-1 min-w-0'>
              <p className='text-gray-800 text-sm leading-4 font-medium mb-1'>
                {alert.title}
              </p>
              <p className='text-gray-600 text-sm mb-1 leading-4'>
                {alert.message}
              </p>
              <p className='text-gray-600 text-sm leading-4'>
                {formatDateTime(alert.created_at, t('date_locale'))}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-5'>
            <div className='flex items-center gap-3 rounded-r-full h-full'>
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  !isRead
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-700'
                }`}
              >
                {!isRead ? t('alerts.unread') : t('alerts.read')}
              </span>

              {/* ✅ Call Button */}
              <button
                onClick={() => {
                  handleOpenCallPopup(alert)
                }}
                className='p-2 bg-green-600 hover:bg-green-700 rounded-full transition-colors'
                title={t('alerts.call_recipients')}
              >
                <IoCallOutline className='text-white text-xl' />
              </button>

              {/* ✅ Expand Button */}
              <button
                onClick={toggleExpand}
                className='p-2 bg-[#3a3d4d] rounded-full transition-colors'
              >
                {isExpanded ? (
                  <IoRemove className='text-white text-xl' />
                ) : (
                  <IoAddCircleOutline className='text-white text-xl' />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className='bg-white rounded-lg p-6 border border-gray-200 mt-2 mb-4 shadow-sm'>
          <div className='grid grid-cols-2 gap-6'>
            <div>
              <img
                src={`${FRAME_URL}`}
                alt={t('alerts.alert_detection_image_alt')}
                className='w-full h-auto object-cover rounded-lg'
              />
            </div>

            <div className='text-gray-800'>
              <div className='grid grid-cols-2 gap-4 mb-6'>
                <div>
                  <h4 className='text-gray-800 text-sm font-semibold mb-2'>
                    {t('alerts.priority')}
                  </h4>
                  <p className='text-gray-600'>
                    {getPriorityText(alert_priority)}
                  </p>
                </div>
                <div>
                  <h4 className='text-gray-800 text-sm font-semibold mb-2'>
                    {t('alerts.location')}
                  </h4>
                  <p className='text-gray-600'>{roi_name}</p>
                </div>
                <div>
                  <h4 className='text-gray-800 text-sm font-semibold mb-2'>
                    {t('alerts.date')}
                  </h4>
                  <p className='text-gray-600'>
                    {formatDateTime(alert.created_at, t('date_locale'))}
                  </p>
                </div>
              </div>

              <div className='mb-6'>
                <h3 className='text-gray-800 text-lg font-semibold mb-3'>
                  {t('alerts.information')}:
                </h3>
                <div className='space-y-2'>
                  <p className='text-gray-600'>
                    <span className='font-medium'>{t('alerts.unit')}:</span>{' '}
                    {roi_name}
                  </p>
                  <p className='text-gray-600'>
                    <span className='font-medium'>{t('alerts.camera')}:</span>{' '}
                    {camera_name}
                  </p>
                  <p className='text-gray-600'>
                    <span className='font-medium'>{t('alerts.time')}:</span>{' '}
                    {formatDateTime(alert.created_at, t('date_locale'))}
                  </p>
                  <p className='text-gray-600'>
                    <span className='font-medium'>
                      {t('alerts.confidence')}:
                    </span>{' '}
                    {confidence_score
                      ? (confidence_score * 100).toFixed(0) + '%'
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className='text-gray-800 text-lg font-semibold mb-3'>
              {t('alerts.comments')}:
            </h3>
            <p className='text-gray-600 leading-relaxed'>
              {notes || t('alerts.default_comment')}
            </p>
          </div>
        </div>
      )}

      {/* ✅ Call Popup */}
      {showCallPopup && (
        <CallPopup
          recipients={callRecipients}
          onClose={() => setShowCallPopup(false)}
        />
      )}
    </>
  )
}

export default AlertItem

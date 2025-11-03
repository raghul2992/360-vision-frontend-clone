import React, { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../features/notification/notificationSlice'
import { FaBell } from 'react-icons/fa' // Assuming you have react-icons installed

const NotificationBell = () => {
  const dispatch = useDispatch()
  const { notifications, unreadCount, isLoading, error } = useSelector(
    state => state.notifications
  )
  const { user } = useSelector(state => state.auth)
  const [isOpen, setIsOpen] = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)
  const prevUnreadCount = useRef(unreadCount)
  const dropdownRef = useRef(null) // Ref for the dropdown element
  const tenantId = user?.tenant_id

  useEffect(() => {
    if (user && tenantId) {
      dispatch(fetchNotifications({ tenantId, type: 'camera_status' }))
    }
  }, [user, tenantId, dispatch])

  useEffect(() => {
    if (unreadCount > prevUnreadCount.current) {
      setIsPulsing(true)
      const timer = setTimeout(() => {
        setIsPulsing(false)
      }, 10000) // Duration of the pulse-once animation
      return () => clearTimeout(timer)
    }
    prevUnreadCount.current = unreadCount
  }, [unreadCount])

  const handleBellClick = () => {
    setIsOpen(!isOpen)
    if (isPulsing) {
      setIsPulsing(false) // Stop pulsing if clicked while animating
    }
    if (unreadCount > 0 && tenantId) {
      dispatch(markAllNotificationsAsRead())
      // Optionally, you might want to call an API to mark all as read on the server
    }
  }

  const handleNotificationClick = notificationId => {
    dispatch(markNotificationAsRead(notificationId))
    // Optionally, call API to mark as read on server
  }

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownRef])

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className={`relative p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 focus:outline-none ${
          isPulsing ? 'animate-pulse-once' : ''
        }`}
      >
        <FaBell className='h-6 w-6' />
        {unreadCount > 0 && (
          <span className='absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full'>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className='absolute right-0 mt-2 w-80 bg-gray-800 rounded-md shadow-lg z-20 max-h-96 overflow-y-auto'>
          <div className='p-4 border-b border-gray-700 flex justify-between items-center'>
            <h3 className='text-lg font-semibold text-white'>Notifications</h3>
            <button
              onClick={() => dispatch(markAllNotificationsAsRead())}
              className='text-sm text-blue-400 hover:text-blue-300'
            >
              Mark all as read
            </button>
          </div>
          {isLoading && (
            <p className='p-4 text-white'>Loading notifications...</p>
          )}
          {error && <p className='p-4 text-red-400'>Error: {error}</p>}
          {notifications.length === 0 && !isLoading && (
            <p className='p-4 text-gray-400'>No notifications.</p>
          )}
          <ul>
            {notifications.map(notification => (
              <li
                key={notification.id}
                className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 ${
                  !notification.is_read ? 'bg-gray-900' : ''
                }`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <p
                  className={`font-semibold ${
                    !notification.is_read ? 'text-white' : 'text-gray-300'
                  }`}
                >
                  {notification.title || notification.message}
                </p>
                <p className='text-sm text-gray-400'>
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default NotificationBell

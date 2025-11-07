import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  fetchNotifications,
  clearNotifications,
  updateNotificationAPI
} from '../features/notification/notificationSlice'
import { FaBell } from 'react-icons/fa'
import eventEmitter from '../utils/eventEmitter'

const NotificationBell = ({ unreadCount }) => {
  const dispatch = useDispatch()
  const { notifications, isLoading, error } = useSelector(
    state => state.notifications
  )
  const tenantId = localStorage.getItem('tenant_id')

  const [isOpen, setIsOpen] = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)
  const [notificationList, setNotificationList] = useState([])

  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const LIMIT = 10

  const prevUnreadCount = useRef(unreadCount)
  const dropdownRef = useRef(null)
  const loaderRef = useRef(null)
  const isFetchingRef = useRef(false)
  const observerRef = useRef(null)

  // Sync notifications into list
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      setNotificationList(prev => {
        if (page === 0) return [...notifications]
        const newOnes = notifications.filter(
          n => !prev.some(p => p.id === n.id)
        )
        return [...prev, ...newOnes]
      })
    } else if (page === 0) {
      setNotificationList([])
    }
  }, [notifications, page])

  // Fetch notifications
  const fetchNotificationData = useCallback(
    async pageNum => {
      if (!tenantId || isFetchingRef.current) return

      isFetchingRef.current = true
      try {
        const queryParams = {
          type: 'camera_status',
          limit: LIMIT,
          skip: pageNum
        }

        if (pageNum === 0) dispatch(clearNotifications())

        const result = await dispatch(
          fetchNotifications({ tenantId, queryParams })
        )

        if (!result.payload || result.payload.length < LIMIT) {
          setHasMore(false)
        }
      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        isFetchingRef.current = false
      }
    },
    [tenantId, dispatch]
  )

  // Load more notifications
  const loadMore = useCallback(() => {
    if (!hasMore || isLoading || isFetchingRef.current) return
    setPage(prevPage => {
      const nextPage = prevPage + 1
      fetchNotificationData(nextPage)
      return nextPage
    })
  }, [hasMore, isLoading, fetchNotificationData])

  // Bell click handler
  const handleBellClick = () => {
    if (!isOpen && tenantId) {
      setPage(0)
      setHasMore(true)
      setNotificationList([])
      fetchNotificationData(0)
    } else if (isOpen && unreadCount > 0 && tenantId) {
      setPage(0)
      setHasMore(true)
      setNotificationList([])
      fetchNotificationData(0)
    }
    setIsOpen(!isOpen)
    if (isPulsing) setIsPulsing(false)
  }

  // New notification event
  useEffect(() => {
    const handleNewNotification = () => {
      if (tenantId && isOpen) {
        setPage(0)
        setHasMore(true)
        setNotificationList([])
        fetchNotificationData(0)
      }
    }
    eventEmitter.on('newNotification', handleNewNotification)
    return () => eventEmitter.off('newNotification', handleNewNotification)
  }, [tenantId, isOpen, fetchNotificationData])

  // Pulse animation
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current) {
      setIsPulsing(true)
      const timer = setTimeout(() => setIsPulsing(false), 10000)
      return () => clearTimeout(timer)
    }
    prevUnreadCount.current = unreadCount
  }, [unreadCount])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    if (!isOpen || !loaderRef.current || !hasMore) return

    observerRef.current = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (
          entry.isIntersecting &&
          hasMore &&
          !isLoading &&
          !isFetchingRef.current
        ) {
          setTimeout(() => loadMore(), 300)
        }
      },
      { root: null, threshold: 0.1, rootMargin: '100px' }
    )

    observerRef.current.observe(loaderRef.current)

    return () => observerRef.current && observerRef.current.disconnect()
  }, [isOpen, hasMore, isLoading, loadMore])

  // Mark single notification as read
  const handleNotificationClick = notification => {
    if (!notification.is_read) {
      // Update backend
      dispatch(
        updateNotificationAPI({
          tenantId,
          notificationId: notification.id,
          data: { is_read: 'true' }
        })
      )

      setNotificationList(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, is_read: 'true' } : n
        )
      )
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className='relative' ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={handleBellClick}
        className={`relative p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 focus:outline-none ${
          isPulsing ? 'animate-pulse-once' : ''
        }`}
      >
        <FaBell className='h-6 w-6' />
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className='absolute right-5 mt-2 min-w-[500px] bg-gray-800 rounded-lg shadow-lg z-20 max-h-[350px] flex flex-col'>
          {/* Header */}
          <div className='sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center z-10'>
            <h3 className='text-lg font-semibold text-white'>Notifications</h3>
          </div>

          {/* Scrollable Content */}
          <div className='flex-1 overflow-y-auto scrollbar-thin'>
            {notificationList.length === 0 && !isLoading && !error && (
              <p className='p-4 text-gray-400 text-sm'>No notifications.</p>
            )}

            {error && (
              <p className='p-4 text-red-400 text-sm'>Error: {error}</p>
            )}

            <ul className='divide-y divide-gray-700'>
              {notificationList.map(notification => (
                <li
                  key={notification.id}
                  className={`p-4 cursor-pointer hover:bg-gray-700 transition flex justify-between items-center ${
                    !notification.is_read ? 'bg-gray-900' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div>
                    <p
                      className={`font-semibold ${
                        !notification.is_read ? 'text-white' : 'text-gray-300'
                      }`}
                    >
                      {notification.title || notification.message}
                    </p>
                    <p className='text-xs text-gray-400 mt-1'>
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Read / Unread Label */}
                  <span
                    className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                      !notification.is_read
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-600 text-gray-200'
                    }`}
                  >
                    {!notification.is_read ? 'Unread' : 'Read'}
                  </span>
                </li>
              ))}
            </ul>

            {/* Loading */}
            {isLoading && (
              <div className='text-center py-4 text-gray-400 text-sm'>
                Loading notifications...
              </div>
            )}

            {hasMore && notificationList.length > 0 && !isLoading && (
              <div
                ref={loaderRef}
                className='py-4 flex items-center justify-center'
              >
                <button
                  onClick={loadMore}
                  className='px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition text-sm'
                >
                  Load More
                </button>
              </div>
            )}

            {/* End */}
            {!hasMore && notificationList.length > 0 && (
              <div className='text-center py-4 text-gray-400 text-sm'>
                No more notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell

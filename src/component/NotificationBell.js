import React, { useEffect, useState, useRef, useCallback } from 'react'
import { bgcolors, borderstyles, colors, textcolors, iconSizes } from '../theme'
import { useSelector, useDispatch } from 'react-redux'
import {
  fetchNotifications,
  clearNotifications,
  updateNotificationAPI
} from '../features/notification/notificationSlice'
import { BellIcon } from '../icons'
import eventEmitter from '../utils/eventEmitter'
import { useTranslation } from 'react-i18next'

const NotificationBell = ({ unreadCount }) => {
  const dispatch = useDispatch()
  const { notifications, isLoading, error } = useSelector(
    state => state.notifications
  )
  const tenantId = localStorage.getItem('tenant_id')

  const { t } = useTranslation()

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
        className={`relative p-2 rounded-xl ${borderstyles.borderMedium} ${borderstyles.hoverAccent} ${textcolors.dim} ${textcolors.hoverPrimary} focus:outline-none transition-colors ${bgcolors.surface} ${
          isPulsing ? 'animate-pulse-once' : ''
        }`}
      >
        <BellIcon size={iconSizes.button} className={textcolors.dim} />
        {unreadCount > 0 && (
          <span className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 ${bgcolors.danger} ${textcolors.white} text-[10px] font-bold rounded-full flex items-center justify-center leading-none`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[400px] ${bgcolors.white} rounded-2xl shadow-xl ${borderstyles.light} z-[9999] max-h-[420px] flex flex-col overflow-hidden`}>

          {/* Header */}
          <div className={`sticky top-0 ${bgcolors.white} px-4 py-3 ${borderstyles.bottomLight} flex justify-between items-center z-10`}>
            <h3 className='text-base font-bold' style={{ color: colors.text }}>
              {t('notificationBell.title')}
            </h3>
            {unreadCount > 0 && (
              <span className='text-xs font-semibold px-2 py-0.5 rounded-full' style={{ backgroundColor: colors.primaryTag, color: colors.primary }}>
                {unreadCount} unread
              </span>
            )}
          </div>

          {/* Scrollable Content */}
          <div className='flex-1 overflow-y-auto' style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

            {notificationList.length === 0 && !isLoading && !error && (
              <p className='p-6 text-center text-sm' style={{ color: colors.textDim }}>
                {t('notificationBell.emptyState')}
              </p>
            )}

            {error && (
              <p className='p-4 text-sm' style={{ color: colors.danger }}>
                {t('notificationBell.errorMessage', { error })}
              </p>
            )}

            <ul className={borderstyles.divider}>
              {notificationList.map(notification => (
                <li
                  key={notification.id}
                  className='p-4 cursor-pointer transition-colors flex justify-between items-start gap-3'
                  style={{ backgroundColor: !notification.is_read ? colors.primaryFaint : 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = colors.bg2}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = !notification.is_read ? colors.primaryFaint : 'transparent'}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Left accent dot */}
                  <span
                    className='mt-1.5 w-2 h-2 rounded-full flex-shrink-0'
                    style={{ backgroundColor: !notification.is_read ? colors.primary : colors.border2 }}
                  />

                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold truncate' style={{ color: !notification.is_read ? colors.text : colors.textDim }}>
                      {notification.title || notification.message}
                    </p>
                    {(notification.name || notification.number || notification.email) && (
                      <p className='text-xs mt-0.5 truncate' style={{ color: colors.textMute }}>
                        {notification.name || notification.number || notification.email}
                      </p>
                    )}
                    <p className='text-xs mt-1' style={{ color: colors.textMute }}>
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Read / Unread badge */}
                  <span
                    className='flex-shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full'
                    style={
                      !notification.is_read
                        ? { backgroundColor: colors.dangerBg, color: colors.danger, border: `1px solid ${colors.dangerBorderLight}` }
                        : { backgroundColor: colors.bg2, color: colors.textDim, border: `1px solid ${colors.border}` }
                    }
                  >
                    {!notification.is_read ? t('notificationBell.status.unread') : t('notificationBell.status.read')}
                  </span>
                </li>
              ))}
            </ul>

            {/* Loading */}
            {isLoading && (
              <div className='text-center py-4 text-sm' style={{ color: colors.textDim }}>
                {t('notificationBell.loading_notifications')}
              </div>
            )}

            {/* Load More */}
            {hasMore && notificationList.length > 0 && !isLoading && (
              <div ref={loaderRef} className='py-3 flex items-center justify-center'>
                <button
                  onClick={loadMore}
                  className='px-4 py-1.5 text-sm font-medium rounded-lg transition-colors'
                  style={{ backgroundColor: colors.accentSubtle, color: colors.primary }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = colors.primaryMid}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = colors.accentSubtle}
                >
                  {t('notificationBell.loadMoreButton')}
                </button>
              </div>
            )}

            {/* End of list */}
            {!hasMore && notificationList.length > 0 && (
              <div className='text-center py-3 text-xs' style={{ color: colors.textMute }}>
                {t('notificationBell.noMoreNotifications')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell

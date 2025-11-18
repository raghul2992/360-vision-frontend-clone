// features/notifications/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/apihelper'

// Async Thunk to fetch notifications with filters
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ tenantId, queryParams = {} }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams()

      // Add all query parameters
      if (queryParams.id) params.append('id', queryParams.id)
      if (queryParams.location_id)
        params.append('location_id', queryParams.location_id)
      if (queryParams.camera_id)
        params.append('camera_id', queryParams.camera_id)
      if (queryParams.type) params.append('type', queryParams.type)
      if (queryParams.is_read !== undefined)
        params.append('is_read', queryParams.is_read)
      if (queryParams.title) params.append('title', queryParams.title)
      if (queryParams.message) params.append('message', queryParams.message)
      if (queryParams.created_after)
        params.append('created_after', queryParams.created_after)
      if (queryParams.created_before)
        params.append('created_before', queryParams.created_before)
      if (queryParams.meta_filters)
        params.append('meta_filters', queryParams.meta_filters)

      // Pagination
      params.append('skip', queryParams.skip || 0)
      params.append('limit', queryParams.limit || 10)

      const url = `/api/v1/tenants/${
        tenantId || localStorage.getItem('tenant_id')
      }/notification/?${params.toString()}`
      console.log('Fetching notifications from:', url)

      const response = await api.get(url)
      console.log('Notifications fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch notifications'
      )
    }
  }
)

// Async Thunk to mark notification as read
export const markNotificationAsReadAPI = createAsyncThunk(
  'notifications/markAsRead',
  async ({ tenantId, notificationId }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/api/v1/tenants/${tenantId}/notification/${notificationId}/read/`
      )
      return { notificationId, data: response.data }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark notification as read'
      )
    }
  }
)

// Async Thunk to update a notification
export const updateNotificationAPI = createAsyncThunk(
  'notifications/updateNotification',
  async ({ tenantId, notificationId, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/api/v1/tenants/${tenantId}/notification/${notificationId}`,
        data
      )
      return { notificationId, data: response.data }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update notification'
      )
    }
  }
)

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    lastFetched: null,
    filters: {
      tenantId: null,
      locationId: null,
      cameraId: null,
      type: null
    }
  },
  reducers: {
    addNotification: (state, action) => {
      const newNotification = {
        ...action.payload,
        is_read: false,
        id: action.payload?.id || Date.now(),
        created_at: action.payload.created_at || new Date().toISOString(),
        name: action.payload.name || null,
        number: action.payload.number || null,
        email: action.payload.email || null
      }
      const exists = state.notifications.some(n => n.id === newNotification.id)
      if (!exists) {
        state.notifications.unshift(newNotification)
        state.unreadCount += 1
      }
    },

    markNotificationAsRead: (state, action) => {
      const notification = state.notifications.find(
        n => n.id === action.payload
      )
      if (notification && !notification.is_read) {
        notification.is_read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },

    markAllNotificationsAsRead: state => {
      state.notifications.forEach(n => {
        n.is_read = true
      })
      state.unreadCount = 0
    },

    clearNotifications: state => {
      state.notifications = []
      state.unreadCount = 0
      state.lastFetched = null
    },

    removeNotification: (state, action) => {
      const notification = state.notifications.find(
        n => n.id === action.payload
      )
      if (notification && !notification.is_read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
      state.notifications = state.notifications.filter(
        n => n.id !== action.payload
      )
    },

    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchNotifications.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false
        state.lastFetched = new Date().toISOString()

        const fetchedNotifications = Array.isArray(action.payload)
          ? action.payload
          : action.payload.results || []

        const newNotifications = fetchedNotifications.map(n => ({
          ...n,
          is_read:
            n.is_read === 'false'
              ? false
              : n.is_read === 'true'
              ? true
              : n.is_read
        }))

        const existingNotificationIds = new Set(
          state.notifications.map(n => n.id)
        )

        const uniqueNewNotifications = newNotifications.filter(
          n => !existingNotificationIds.has(n.id)
        )

        state.notifications = newNotifications.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )

        state.unreadCount = state.notifications.filter(n => !n.is_read).length
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      .addCase(markNotificationAsReadAPI.fulfilled, (state, action) => {
        const { notificationId } = action.payload
        const notification = state.notifications.find(
          n => n.id === notificationId
        )
        if (notification && !notification.is_read) {
          notification.is_read = true
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
      .addCase(updateNotificationAPI.fulfilled, (state, action) => {
        const { notificationId, data } = action.payload
        const notificationIndex = state.notifications.findIndex(
          n => n.id === notificationId
        )
        if (notificationIndex !== -1) {
          const oldIsRead = state.notifications[notificationIndex].is_read
          state.notifications[notificationIndex] = {
            ...state.notifications[notificationIndex],
            ...data,
            is_read: data.is_read === 'true' || data.is_read === true
          }
          if (
            oldIsRead === false &&
            state.notifications[notificationIndex].is_read === true
          ) {
            state.unreadCount = Math.max(0, state.unreadCount - 1)
          } else if (
            oldIsRead === true &&
            state.notifications[notificationIndex].is_read === false
          ) {
            state.unreadCount += 1
          }
        }
      })
  }
})

export const {
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  removeNotification,
  setFilters
} = notificationSlice.actions

export default notificationSlice.reducer

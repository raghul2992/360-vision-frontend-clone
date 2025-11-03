// features/notifications/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/apihelper'

// Helper functions for localStorage persistence
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('notifications')
    if (serializedState === null) {
      return undefined
    }
    return JSON.parse(serializedState)
  } catch (err) {
    console.error('Could not load state from localStorage', err)
    return undefined
  }
}

const saveState = state => {
  try {
    const serializedState = JSON.stringify(state)
    localStorage.setItem('notifications', serializedState)
  } catch (err) {
    console.error('Could not save state to localStorage', err)
  }
}

// Async Thunk to fetch notifications with GET method
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ tenantId, queryParams = {}, type = null }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(queryParams)
      if (type) {
        params.append('type', type)
      }

      const url = `/api/v1/tenants/${tenantId}/notification/?${params.toString()}`
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

// Async Thunk to mark notification as read (POST/PUT method)
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

// Load persisted state
const persistedState = loadState()

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: persistedState || {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    lastFetched: null
  },
  reducers: {
    // Add notification from WebSocket
    addNotification: (state, action) => {
      const newNotification = {
        ...action.payload,
        is_read: false,
        id: action.payload.id || Date.now(),
        created_at: action.payload.created_at || new Date().toISOString()
      }

      // Check if notification already exists
      const exists = state.notifications.some(n => n.id === newNotification.id)
      if (!exists) {
        state.notifications.unshift(newNotification)
        state.unreadCount += 1
        saveState(state)
      }
    },

    // Mark single notification as read
    markNotificationAsRead: (state, action) => {
      const notification = state.notifications.find(
        n => n.id === action.payload
      )
      if (notification && !notification.is_read) {
        notification.is_read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
        saveState(state)
      }
    },

    // Mark all notifications as read
    markAllNotificationsAsRead: state => {
      state.notifications.forEach(n => {
        n.is_read = true
      })
      state.unreadCount = 0
      saveState(state)
    },

    // Clear all notifications
    clearNotifications: state => {
      state.notifications = []
      state.unreadCount = 0
      state.lastFetched = null
      saveState(state)
    },

    // Remove single notification
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
      saveState(state)
    }
  },
  extraReducers: builder => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false
        state.lastFetched = new Date().toISOString()

        // Handle response data (could be array or object with results)
        const fetchedNotifications = Array.isArray(action.payload)
          ? action.payload
          : action.payload.results || []

        // Normalize fetched notifications
        const newNotifications = fetchedNotifications.map(n => ({
          ...n,
          is_read: n.is_read || false
        }))

        // Get existing notification IDs
        const existingNotificationIds = new Set(
          state.notifications.map(n => n.id)
        )

        // Filter out duplicates
        const uniqueNewNotifications = newNotifications.filter(
          n => !existingNotificationIds.has(n.id)
        )

        // Merge and sort by created_at
        state.notifications = [
          ...uniqueNewNotifications,
          ...state.notifications
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

        // Update unread count
        state.unreadCount = state.notifications.filter(n => !n.is_read).length

        saveState(state)
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Mark as read API call
      .addCase(markNotificationAsReadAPI.fulfilled, (state, action) => {
        const { notificationId } = action.payload
        const notification = state.notifications.find(
          n => n.id === notificationId
        )
        if (notification && !notification.is_read) {
          notification.is_read = true
          state.unreadCount = Math.max(0, state.unreadCount - 1)
          saveState(state)
        }
      })
  }
})

export const {
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  removeNotification
} = notificationSlice.actions

export default notificationSlice.reducer

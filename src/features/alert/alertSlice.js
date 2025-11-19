// features/alert/alertSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/apihelper'

// ===========================
// Async Thunk: Fetch Alerts
// ===========================
export const fetchAlerts = createAsyncThunk(
  'alerts/fetchAlerts',
  async ({ tenantId, queryParams = {} } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams()

      // Add all query parameters dynamically
      for (const key in queryParams) {
        if (queryParams[key] !== undefined && queryParams[key] !== null) {
          params.append(key, queryParams[key])
        }
      }

      // Pagination defaults
      if (!params.has('skip')) params.append('skip', 0)
      if (!params.has('limit')) params.append('limit', 10)

      const resolvedTenantId = tenantId || localStorage.getItem('tenant_id')
      const url = `/api/v1/tenants/${resolvedTenantId}/notification/?${params.toString()}`

      console.log('Fetching alerts from:', url)
      const response = await api.get(url)

      const data = response.data
      console.log('Alerts fetched:', data)
      return data
    } catch (error) {
      console.error('Error fetching alerts:', error)
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch alerts'
      )
    }
  }
)

export const fetchStatusCountAlerts = createAsyncThunk(
  'alerts/fetchStatusCountAlerts',
  async ({ tenantId, queryParams = {} } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams()

      // Add all query parameters dynamically
      for (const key in queryParams) {
        if (queryParams[key] !== undefined && queryParams[key] !== null) {
          params.append(key, queryParams[key])
        }
      }

      const resolvedTenantId = tenantId || localStorage.getItem('tenant_id')
      const url = `/api/v1/tenants/${resolvedTenantId}/notification/is_read/count?${params.toString()}`

      console.log('Fetching alerts from:', url)
      const response = await api.get(url)

      const data = response.data
      console.log('Alerts status fetched:', data)
      return data
    } catch (error) {
      console.error('Error fetching alerts:', error)
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch alerts'
      )
    }
  }
)

// ===========================
// Async Thunk: Mark Alert As Read
// ===========================
export const markAlertAsReadAPI = createAsyncThunk(
  'alerts/markAsRead',
  async ({ tenantId, alertId }, { rejectWithValue }) => {
    try {
      const resolvedTenantId = tenantId || localStorage.getItem('tenant_id')
      const response = await api.put(
        `/api/v1/tenants/${resolvedTenantId}/notification/${alertId}/read/`
      )
      return { alertId, data: response.data }
    } catch (error) {
      console.error('Error marking alert as read:', error)
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark alert as read'
      )
    }
  }
)

// Async Thunk to update an alert
export const updateAlertAPI = createAsyncThunk(
  'alerts/updateAlert',
  async ({ tenantId, alertId, data }, { rejectWithValue }) => {
    try {
      const resolvedTenantId = tenantId || localStorage.getItem('tenant_id')
      const response = await api.put(
        `/api/v1/tenants/${resolvedTenantId}/notification/${alertId}`,
        data
      )
      return { alertId, data: response.data }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update alert'
      )
    }
  }
)

// ===========================
// Slice Definition
// ===========================
const alertSlice = createSlice({
  name: 'alerts',
  initialState: {
    alerts: [],
    unreadCount: 0,
    statusCounts: [],
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
    addAlert: (state, action) => {
      const newAlert = {
        ...action.payload,
        id: action.payload.id || Date.now(),
        is_read: action.payload.is_read ?? false,
        created_at: action.payload.created_at || new Date().toISOString()
      }

      const exists = state.alerts.some(n => n.id === newAlert.id)
      if (!exists) {
        state.alerts.unshift(newAlert)
        if (!newAlert.is_read) state.unreadCount += 1
      }
    },

    markAlertAsRead: (state, action) => {
      const alert = state.alerts.find(n => n.id === action.payload)
      if (alert && !alert.is_read) {
        alert.is_read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },

    markAllAlertsAsRead: state => {
      state.alerts.forEach(n => (n.is_read = true))
      state.unreadCount = 0
    },

    resetAlerts: state => {
      state.alerts = []
      state.unreadCount = 0
      state.lastFetched = null
    },

    removeAlert: (state, action) => {
      const alert = state.alerts.find(n => n.id === action.payload)
      if (alert && !alert.is_read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
      state.alerts = state.alerts.filter(n => n.id !== action.payload)
    },

    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    }
  },
  extraReducers: builder => {
    builder
      // ===== Fetch Alerts =====
      .addCase(fetchAlerts.pending, state => {
        state.isLoading = true
        state.error = null
      })

      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.isLoading = false
        state.lastFetched = new Date().toISOString()

        const payload = action.payload
        const fetchedAlerts = Array.isArray(payload)
          ? payload
          : payload?.results || []

        // Normalize is_read field
        const normalizedAlerts = fetchedAlerts.map(n => ({
          ...n,
          is_read:
            n.is_read === 'false'
              ? false
              : n.is_read === 'true'
              ? true
              : !!n.is_read
        }))

        // If reset is true, replace alerts; otherwise, append
        if (action.meta.arg.reset) {
          state.alerts = normalizedAlerts
        } else {
          const newAlerts = normalizedAlerts.filter(
            alert => !state.alerts.some(existing => existing.id === alert.id)
          )
          state.alerts = [...state.alerts, ...newAlerts].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          )
        }

        // Update unread count
        state.unreadCount = state.alerts.filter(n => !n.is_read).length
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(fetchStatusCountAlerts.fulfilled, (state, action) => {
        state.isLoading = false
        state.lastFetched = new Date().toISOString()
        const payload = action.payload
        console.log(payload.unread)
        state.statusCounts = {
          read: payload.read ?? 0,
          unread: payload.unread ?? 0
        }
      })
      .addCase(fetchStatusCountAlerts.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchStatusCountAlerts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // ===== Mark as Read =====
      .addCase(markAlertAsReadAPI.fulfilled, (state, action) => {
        const { alertId } = action.payload
        const alert = state.alerts.find(n => n.id === alertId)
        if (alert && !alert.is_read) {
          alert.is_read = true
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
      .addCase(updateAlertAPI.fulfilled, (state, action) => {
        const { alertId, data } = action.payload
        const alertIndex = state.alerts.findIndex(n => n.id === alertId)
        if (alertIndex !== -1) {
          const oldIsRead = state.alerts[alertIndex].is_read
          state.alerts[alertIndex] = {
            ...state.alerts[alertIndex],
            ...data,
            is_read: data.is_read === 'true' || data.is_read === true
          }
          if (
            oldIsRead === false &&
            state.alerts[alertIndex].is_read === true
          ) {
            state.unreadCount = Math.max(0, state.unreadCount - 1)
          } else if (
            oldIsRead === true &&
            state.alerts[alertIndex].is_read === false
          ) {
            state.unreadCount += 1
          }
        }
      })
  }
})

// ===========================
// Exports
// ===========================
export const {
  addAlert,
  markAlertAsRead,
  markAllAlertsAsRead,
  resetAlerts,
  removeAlert,
  setFilters
} = alertSlice.actions

export default alertSlice.reducer

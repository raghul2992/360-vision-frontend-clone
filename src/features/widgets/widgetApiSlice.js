import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/apihelper'

export const updateWidgetLayout = createAsyncThunk(
  'widgets/updateLayout',
  async ({ tenantId, layout }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/v1/tenants/${tenantId}/widgets/`, {
        widget_config: layout
      })
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update widget layout'
      )
    }
  }
)

export const getTenant = createAsyncThunk(
  'widgets/getTenant',
  async ({ tenant_id, skip, limit }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/v1/tenants/${tenant_id}?skip=${skip}&limit=${limit}`
      )
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch tenant data'
      )
    }
  }
)

export const getAlertTimeline = createAsyncThunk(
  'widgets/getAlertTimeline',
  async (
    { tenant_id, camera_id, location_id, created_after, created_before },
    { rejectWithValue }
  ) => {
    try {
      let url = `/api/v1/tenants/${tenant_id}/reports/alert_timeline`
      const params = new URLSearchParams()
      if (camera_id) params.append('camera_id', camera_id)
      if (location_id) params.append('location_id', location_id)
      if (created_after) params.append('created_after', created_after)
      if (created_before) params.append('created_before', created_before)
      const query = params.toString()
      if (query) {
        url += `?${query}`
      }
      const response = await api.get(url)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch tenant data'
      )
    }
  }
)

export const getDetectionAnalytics = createAsyncThunk(
  'widgets/getDetectionAnalytics',
  async (
    { tenant_id, camera_id, location_id, created_after, created_before },
    { rejectWithValue }
  ) => {
    try {
      let url = `/api/v1/alerts`
      const params = new URLSearchParams()
      params.append('type', 'event_alert')
      if (camera_id) params.append('camera_id', camera_id)
      if (location_id) params.append('location_id', location_id)
      if (created_after) params.append('created_after', created_after)
      if (created_before) params.append('created_before', created_before)
      params.append('skip', 0)
      params.append('limit', 100)
      const query = params.toString()
      if (query) {
        url += `?${query}`
      }
      const response = await api.get(url)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch detection analytics'
      )
    }
  }
)

export const getPriorityAnalytics = createAsyncThunk(
  'widgets/getPriorityAnalytics',
  async (
    { tenant_id, camera_id, location_id, created_after, created_before },
    { rejectWithValue }
  ) => {
    try {
      let url = `/api/v1/alerts`
      const params = new URLSearchParams()
      params.append('type', 'event_alert')
      if (camera_id) params.append('camera_id', camera_id)
      if (location_id) params.append('location_id', location_id)
      if (created_after) params.append('created_after', created_after)
      if (created_before) params.append('created_before', created_before)
      params.append('skip', 0)
      params.append('limit', 100)
      const query = params.toString()
      if (query) {
        url += `?${query}`
      }
      const response = await api.get(url)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch priority analytics'
      )
    }
  }
)

export const getAlertTypeBreakdown = createAsyncThunk(
  'widgets/getAlertTypeBreakdown',
  async (
    { tenant_id, created_after, created_before, location_id, camera_id },
    { rejectWithValue }
  ) => {
    try {
      let url = `/api/v1/tenants/${tenant_id}/reports/alert_type_breakdown`
      const params = new URLSearchParams()
      if (created_after) params.append('created_after', created_after)
      if (created_before) params.append('created_before', created_before)
      if (location_id) params.append('location_id', location_id)
      if (camera_id) params.append('camera_id', camera_id)
      const query = params.toString()
      if (query) {
        url += `?${query}`
      }
      const response = await api.get(url)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch alert type breakdown'
      )
    }
  }
)

export const getTopProblematicRois = createAsyncThunk(
  'widgets/getTopProblematicRois',
  async (
    {
      tenant_id,
      created_after,
      created_before,
      location_id,
      camera_id,
      limit = 5
    },
    { rejectWithValue }
  ) => {
    try {
      let url = `/api/v1/tenants/${tenant_id}/reports/top_problematic_rois`
      const params = new URLSearchParams()
      if (created_after) params.append('created_after', created_after)
      if (created_before) params.append('created_before', created_before)
      if (location_id) params.append('location_id', location_id)
      if (camera_id) params.append('camera_id', camera_id)
      params.append('limit', limit)

      const query = params.toString()
      if (query) {
        url += `?${query}`
      }

      const response = await api.get(url)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch top problematic ROIs'
      )
    }
  }
)

const widgetApiSlice = createSlice({
  name: 'widgetApi',
  initialState: {
    tenant: null, // Store the entire tenant object
    layout: [],
    isLoading: false, // General loading state for layout updates, etc.
    error: null,
    operationSuccess: false,
    alertTimeline: [],
    alertTypeBreakdown: [],
    topProblematicRois: [],
    detectionAnalytics: [],
    priorityAnalytics: [],
    isAlertTimelineLoading: false,
    isAlertTypeBreakdownLoading: false,
    isTopProblematicRoisLoading: false,
    isDetectionAnalyticsLoading: false,
    isPriorityAnalyticsLoading: false
  },
  reducers: {
    clearError: state => {
      state.error = null
    },
    resetOperation: state => {
      state.operationSuccess = false
    }
  },
  extraReducers: builder => {
    builder
      // Update Widget Layout
      .addCase(updateWidgetLayout.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateWidgetLayout.fulfilled, (state, action) => {
        state.isLoading = false
        state.operationSuccess = true
        // Optionally update the tenant data if needed
      })
      .addCase(updateWidgetLayout.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.operationSuccess = false
      })
      // Get Tenant
      .addCase(getTenant.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getTenant.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload

        // Store the entire tenant object
        state.tenant = payload

        // Also extract and store layout separately for convenience
        const widgetConfig = payload?.meta?.widget_config || []
        if (widgetConfig && Array.isArray(widgetConfig)) {
          state.layout = widgetConfig.map(item => ({
            i: item.widget_name,
            x: item.x || 0,
            y: item.y || 0,
            w: item.w || 6,
            h: item.h || 8,
            minW: 3,
            minH: 8
          }))
        } else {
          state.layout = []
        }
      })
      .addCase(getTenant.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Get Alert Timeline
      .addCase(getAlertTimeline.pending, state => {
        state.isAlertTimelineLoading = true
        state.error = null
      })
      .addCase(getAlertTimeline.fulfilled, (state, action) => {
        state.isAlertTimelineLoading = false
        state.alertTimeline = action.payload
      })
      .addCase(getAlertTimeline.rejected, (state, action) => {
        state.isAlertTimelineLoading = false
        state.error = action.payload
      })
      // Get Alert Type Breakdown
      .addCase(getAlertTypeBreakdown.pending, state => {
        state.isAlertTypeBreakdownLoading = true
        state.error = null
      })
      .addCase(getAlertTypeBreakdown.fulfilled, (state, action) => {
        state.isAlertTypeBreakdownLoading = false
        state.alertTypeBreakdown = action.payload
      })
      .addCase(getAlertTypeBreakdown.rejected, (state, action) => {
        state.isAlertTypeBreakdownLoading = false
        state.error = action.payload
      })
      // Get Top Problematic ROIs
      .addCase(getTopProblematicRois.pending, state => {
        state.isTopProblematicRoisLoading = true
        state.error = null
      })
      .addCase(getTopProblematicRois.fulfilled, (state, action) => {
        state.isTopProblematicRoisLoading = false
        state.topProblematicRois = action.payload
      })
      .addCase(getTopProblematicRois.rejected, (state, action) => {
        state.isTopProblematicRoisLoading = false
        state.error = action.payload
      })
      // Get Detection Analytics
      .addCase(getDetectionAnalytics.pending, state => {
        state.isDetectionAnalyticsLoading = true
        state.error = null
      })
      .addCase(getDetectionAnalytics.fulfilled, (state, action) => {
        state.isDetectionAnalyticsLoading = false
        // Assuming action.payload is the list of alerts, which usually comes nested in a response object (e.g., action.payload.data)
        state.detectionAnalytics = action.payload?.data || []
      })
      .addCase(getDetectionAnalytics.rejected, (state, action) => {
        state.isDetectionAnalyticsLoading = false
        state.error = action.payload
      })
      // Get Priority Analytics
      .addCase(getPriorityAnalytics.pending, state => {
        state.isPriorityAnalyticsLoading = true
        state.error = null
      })
      .addCase(getPriorityAnalytics.fulfilled, (state, action) => {
        state.isPriorityAnalyticsLoading = false
        // Assuming action.payload is the list of alerts
        state.priorityAnalytics = action.payload?.data || []
      })
      .addCase(getPriorityAnalytics.rejected, (state, action) => {
        state.isPriorityAnalyticsLoading = false
        state.error = action.payload
      })
  }
})

export const { clearError, resetOperation } = widgetApiSlice.actions
export default widgetApiSlice.reducer

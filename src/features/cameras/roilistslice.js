import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/apihelper'

// Get List of ROIs for a specific camera
// Get List of ROIs for a specific camera
export const getRois = createAsyncThunk(
  'rois/getRois',
  async (
    { tenantId, cameraId, id = null, skip = 0, limit = 100 },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams()
      if (id !== null) params.append('id', id)
      params.append('skip', skip)
      params.append('limit', limit)

      const response = await api.get(
        `/api/v1/tenants/${tenantId}/camera/${cameraId}/roi/?${params.toString()}`
      )

      // ROI API sometimes returns { data: [...] } or just an array
      return response.data?.data || response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch ROIs'
      )
    }
  }
)

// Create ROI for a specific camera
export const createRoi = createAsyncThunk(
  'rois/createRoi',
  async ({ tenantId, cameraId, roiData }, { rejectWithValue }) => {
    try {
      const operation = process.env.REACT_APP_CAMERA_OPERATION
        ? `${process.env.REACT_APP_CAMERA_OPERATION}`
        : true
      const response = await api.post(
        `/api/v1/tenants/${tenantId}/camera/${cameraId}/roi/?operation=${operation}`,
        roiData
      )
      return response.data || response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create ROI'
      )
    }
  }
)

// Update ROI for a specific camera
export const updateRoi = createAsyncThunk(
  'rois/updateRoi',
  async ({ tenantId, cameraId, roiId, roiData }, { rejectWithValue }) => {
    try {
      const operation = process.env.REACT_APP_CAMERA_OPERATION
        ? `${process.env.REACT_APP_CAMERA_OPERATION}`
        : true
      const response = await api.put(
        `/api/v1/tenants/${tenantId}/camera/${cameraId}/roi/${roiId}?operation=${operation}`,
        roiData
      )
      return response.data || response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.messages || 'Failed to update ROI'
      )
    }
  }
)

// Delete ROI for a specific camera
export const deleteRoi = createAsyncThunk(
  'rois/deleteRoi',
  async ({ tenantId, cameraId, roiId }, { rejectWithValue }) => {
    try {
      const operation = process.env.REACT_APP_CAMERA_OPERATION
        ? `${process.env.REACT_APP_CAMERA_OPERATION}`
        : true
      await api.delete(
        `/api/v1/tenants/${tenantId}/camera/${cameraId}/roi/${roiId}?operation=${operation}`
      )
      return roiId
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.messages || 'Failed to delete ROI'
      )
    }
  }
)

// Update ROI status
export const updateRoiStatus = createAsyncThunk(
  'rois/updateRoiStatus',
  async ({ tenantId, cameraId, roiId, status }, { rejectWithValue }) => {
    try {
      const operation = process.env.REACT_APP_CAMERA_OPERATION
        ? `${process.env.REACT_APP_CAMERA_OPERATION}`
        : true
      const response = await api.put(
        `/api/v1/tenants/${tenantId}/camera/${cameraId}/roi/${roiId}?operation=${operation}`,
        { status }
      )
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update ROI status'
      )
    }
  }
)

const roiSlice = createSlice({
  name: 'rois',
  initialState: {
    rois: [],
    isLoading: false,
    error: null,
    operationSuccess: false
  },
  reducers: {
    clearRoiError: state => {
      state.error = null
    },
    clearRoiOperationSuccess: state => {
      state.operationSuccess = false
    },
    resetRoiState: state => {
      state.rois = []
      state.isLoading = false
      state.error = null
      state.operationSuccess = false
    }
  },
  extraReducers: builder => {
    builder
      // Get ROIs
      .addCase(getRois.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getRois.fulfilled, (state, action) => {
        state.isLoading = false
        state.rois = action.payload
      })
      .addCase(getRois.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.rois = []
      })
      // Create ROI
      .addCase(createRoi.pending, state => {
        state.isLoading = true
        state.error = null
        state.operationSuccess = false
      })
      .addCase(createRoi.fulfilled, (state, action) => {
        state.isLoading = false
        // state.rois=(action.payload)
        state.operationSuccess = true
      })
      .addCase(createRoi.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.operationSuccess = false
      })
      // Update ROI
      .addCase(updateRoi.pending, state => {
        state.isLoading = true
        state.error = null
        state.operationSuccess = false
      })
      .addCase(updateRoi.fulfilled, (state, action) => {
        state.isLoading = false
        const index = state.rois.findIndex(roi => roi.id === action.payload.id)
        if (index !== -1) {
          state.rois[index] = action.payload
        }
        state.operationSuccess = true
      })
      .addCase(updateRoi.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.operationSuccess = false
      })
      // Delete ROI
      .addCase(deleteRoi.pending, state => {
        state.isLoading = true
        state.error = null
        state.operationSuccess = false
      })
      .addCase(deleteRoi.fulfilled, (state, action) => {
        state.isLoading = false
        state.rois = state.rois.filter(roi => roi.id !== action.payload)
        state.operationSuccess = true
      })
      .addCase(deleteRoi.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.operationSuccess = false
        // Add toast error for failed deletion
        // toast.error(action.payload || 'Failed to delete ROI!'); // This should be handled in the component
      })
      // Update ROI Status
      .addCase(updateRoiStatus.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateRoiStatus.fulfilled, (state, action) => {
        state.isLoading = false
        const index = state.rois.findIndex(roi => roi.id === action.payload.id)
        if (index !== -1) {
          state.rois[index] = action.payload
        }
      })
      .addCase(updateRoiStatus.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  }
})

export const { clearRoiError, clearRoiOperationSuccess, resetRoiState } =
  roiSlice.actions

export default roiSlice.reducer

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/apihelper'

// Get List of ROIs for a specific camera
export const getRois = createAsyncThunk(
  'rois/getRois',
  async ({ tenantId, cameraId }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/v1/tenants/${tenantId}/camera/${cameraId}/roi/`
      )
      return response.data.data || response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.messages || 'Failed to fetch ROIs'
      )
    }
  }
)

// Create ROI for a specific camera
export const createRoi = createAsyncThunk(
  'rois/createRoi',
  async ({ tenantId, cameraId, roiData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/v1/tenants/${tenantId}/camera/${cameraId}/roi/`,
        roiData
      )
      return response.data.data || response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.messages || 'Failed to create ROI'
      )
    }
  }
)

// Update ROI for a specific camera
export const updateRoi = createAsyncThunk(
  'rois/updateRoi',
  async ({ tenantId, cameraId, roiId, roiData }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/api/v1/tenants/${tenantId}/camera/${cameraId}/roi/${roiId}`,
        roiData
      )
      return response.data.data || response.data
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
      await api.delete(
        `/api/v1/tenants/${tenantId}/camera/${cameraId}/roi/${roiId}`
      )
      return roiId
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.messages || 'Failed to delete ROI'
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
        state.rois.push(action.payload)
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
      })
  }
})

export const { clearRoiError, clearRoiOperationSuccess, resetRoiState } =
  roiSlice.actions

export default roiSlice.reducer

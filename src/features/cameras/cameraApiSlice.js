import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/apihelper'

// Get List of Cameras
export const getCameras = createAsyncThunk(
  'cameras/getCameras',
  async ({ tenantId, cameraId }, { rejectWithValue }) => {
    try {
      let url = `/api/v1/tenants/${tenantId}/cameras/`
      if (cameraId) {
        url += `?camera_id=${cameraId}`
      }
      const response = await api.get(url)
      console.log('API Response Data:', response.data)

      // API response has cameras array under data
      const camerasArray = Array.isArray(response.data) ? response.data : []

      return camerasArray
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch cameras'
      )
    }
  }
)

// Create Camera
export const createCamera = createAsyncThunk(
  'cameras/createCamera',
  async ({ tenantId, cameraData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/v1/tenants/${tenantId}/cameras/`,
        cameraData
      )
      return response.data || response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.messages || 'Failed to create camera'
      )
    }
  }
)

// Update Camera
export const updateCamera = createAsyncThunk(
  'cameras/updateCamera',
  async ({ tenantId, cameraId, cameraData }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/api/v1/tenants/${tenantId}/cameras/${cameraId}?operation=true`,
        cameraData
      )
      return response.data || response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update camera'
      )
    }
  }
)

export const deleteCamera = createAsyncThunk(
  'cameras/deleteCamera',
  async ({ tenantId, cameraId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        `/api/v1/tenants/${tenantId}/cameras/${cameraId}?operation=true`
      )
      console.log('Delete response:', response)
      return cameraId
    } catch (error) {
      console.error('Delete error:', error)
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete camera'
      )
    }
  }
)

// Test Camera Connection
export const testCameraConnection = createAsyncThunk(
  'cameras/testCameraConnection',
  async ({ tenantId, connectionData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/v1/tenants/${tenantId}/cameras/test-connection`,
        connectionData
      )
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error.response.data)
      return rejectWithValue(error.response.data || 'Connection test failed')
    }
  }
)

// Get Camera Snapshot
export const getCameraSnapshot = createAsyncThunk(
  'cameras/getCameraSnapshot',
  async (
    { tenantId, cameraId, rtsp_url, username, password },
    { rejectWithValue }
  ) => {
    try {
      // Build URL dynamically
      let url = `/api/v1/tenants/${tenantId}/cameras/snapshot`
      if (cameraId) {
        url += `?camera_id=${cameraId}`
      }

      const response = await api.post(url, {
        rtsp_url,
        username,
        password
      })

      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get snapshot'
      )
    }
  }
)

// Get Camera by ID
export const getCameraById = createAsyncThunk(
  'cameras/getCameraById',
  async ({ tenantId, cameraId }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/v1/tenants/${tenantId}/cameras/${cameraId}`
      )
      return response.data || response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch camera'
      )
    }
  }
)

// Toggle Camera Status
export const toggleCameraStatus = createAsyncThunk(
  'cameras/toggleCameraStatus',
  async ({ tenantId, cameraId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/api/v1/tenants/${tenantId}/cameras/${cameraId}/status`,
        { status }
      )
      return response.data || response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update camera status'
      )
    }
  }
)

const cameraApiSlice = createSlice({
  name: 'cameraApi',
  initialState: {
    cameras: [],
    currentCamera: null,
    isLoading: false,
    error: null,
    testConnectionResult: null,
    snapshotResult: null,
    operationSuccess: false
  },
  reducers: {
    clearCameraError: state => {
      state.error = null
    },
    clearTestConnectionResult: state => {
      state.testConnectionResult = null
    },
    clearSnapshotResult: state => {
      state.snapshotResult = null
    },
    clearOperationSuccess: state => {
      state.operationSuccess = false
    },
    clearCurrentCamera: state => {
      state.currentCamera = null
    },
    resetCameraState: state => {
      state.cameras = []
      state.currentCamera = null
      state.isLoading = false
      state.error = null
      state.testConnectionResult = null
      state.snapshotResult = null
      state.operationSuccess = false
    }
  },
  extraReducers: builder => {
    builder
      // Get Cameras
      .addCase(getCameras.pending, state => {
        state.isLoading = true
        state.error = null
        state.operationSuccess = false
      })
      .addCase(getCameras.fulfilled, (state, action) => {
        state.isLoading = false
        state.cameras = action.payload
        state.error = null
      })
      .addCase(getCameras.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.cameras = []
      })

      // Get Camera by ID
      .addCase(getCameraById.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getCameraById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentCamera = action.payload
        state.error = null
      })
      .addCase(getCameraById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.currentCamera = null
      })

      // Create Camera
      .addCase(createCamera.pending, state => {
        state.isLoading = true
        state.error = null
        state.operationSuccess = false
      })
      .addCase(createCamera.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload) {
          state.cameras.push(action.payload)
        }
        state.operationSuccess = true
        state.error = null
      })
      .addCase(createCamera.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.operationSuccess = false
      })

      // Update Camera
      .addCase(updateCamera.pending, state => {
        state.isLoading = true
        state.error = null
        state.operationSuccess = false
      })
      .addCase(updateCamera.fulfilled, (state, action) => {
        state.isLoading = false
        const index = state.cameras.findIndex(c => c.id === action.payload.id)
        if (index !== -1) {
          state.cameras[index] = action.payload
        }
        state.currentCamera = action.payload
        state.operationSuccess = true
        state.error = null
      })
      .addCase(updateCamera.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.operationSuccess = false
      })

      // Delete Camera
      .addCase(deleteCamera.pending, state => {
        state.isLoading = true
        state.error = null
        state.operationSuccess = false
      })
      .addCase(deleteCamera.fulfilled, (state, action) => {
        state.isLoading = false
        state.cameras = state.cameras.filter(
          camera => camera.id !== action.payload
        )
        state.operationSuccess = true
        state.error = null
      })
      .addCase(deleteCamera.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.operationSuccess = false
      })

      // Test Camera Connection
      .addCase(testCameraConnection.pending, state => {
        state.isLoading = true
        state.error = null
        state.testConnectionResult = null
      })
      .addCase(testCameraConnection.fulfilled, (state, action) => {
        state.isLoading = false
        state.testConnectionResult = action.payload
        state.error = null
      })
      .addCase(testCameraConnection.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.testConnectionResult = null
      })

      // Get Camera Snapshot
      .addCase(getCameraSnapshot.pending, state => {
        state.isLoading = true
        state.error = null
        state.snapshotResult = null
      })
      .addCase(getCameraSnapshot.fulfilled, (state, action) => {
        state.isLoading = false
        state.snapshotResult = action.payload
        state.error = null
      })
      .addCase(getCameraSnapshot.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.snapshotResult = null
      })

      // Toggle Camera Status
      .addCase(toggleCameraStatus.pending, state => {
        state.isLoading = true
        state.error = null
        state.operationSuccess = false
      })
      .addCase(toggleCameraStatus.fulfilled, (state, action) => {
        state.isLoading = false
        const index = state.cameras.findIndex(c => c.id === action.payload.id)
        if (index !== -1) {
          state.cameras[index] = action.payload
        }
        if (
          state.currentCamera &&
          state.currentCamera.id === action.payload.id
        ) {
          state.currentCamera = action.payload
        }
        state.operationSuccess = true
        state.error = null
      })
      .addCase(toggleCameraStatus.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.operationSuccess = false
      })
  }
})

export const {
  clearCameraError,
  clearTestConnectionResult,
  clearSnapshotResult,
  clearOperationSuccess,
  clearCurrentCamera,
  resetCameraState
} = cameraApiSlice.actions

export default cameraApiSlice.reducer

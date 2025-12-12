import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/apihelper'

// Get List of Locations
export const getLocations = createAsyncThunk(
  'locations/getLocations',
  async ({ tenantId, skip = 0, limit = 100 }, { rejectWithValue }) => {
    console.log(tenantId)
    try {
      const response = await api.get(
        `/api/v1/tenants/${tenantId}/locations/?skip=${skip}&limit=${limit}`
      )

      console.log(response)

      const locationsArray = Array.isArray(response.data) ? response.data : []

      return locationsArray
    } catch (error) {
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message)
      }
      return rejectWithValue(error.response.data.message)
    }
  }
)

// Get Locations with Alerts
export const getLocationsWithAlerts = createAsyncThunk(
  'locations/getLocationsWithAlerts',
  async (
    { tenantId, created_after, created_before, is_read, skip = 0, limit = 100 },
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams()
      if (skip) queryParams.append('skip', skip)
      if (limit) queryParams.append('limit', limit)
      if (created_after) queryParams.append('created_after', created_after)
      if (created_before) queryParams.append('created_before', created_before)
      if (is_read !== undefined) queryParams.append('is_read', is_read)

      const queryString = queryParams.toString()
      const url = `/api/v1/tenants/${tenantId}/locations/locations_with_alerts${
        queryString ? `?${queryString}` : ''
      }`

      const response = await api.get(url)
      const locationsArray = Array.isArray(response.data) ? response.data : []
      return locationsArray
    } catch (error) {
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message)
      }
      return rejectWithValue(error.message)
    }
  }
)

// Create a new location
export const createLocation = createAsyncThunk(
  'locations/createLocation',
  async ({ tenantId, locationData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/v1/tenants/${tenantId}/locations/`,
        locationData
      )
      // console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message)
      }
      return rejectWithValue(error.response.data.message)
    }
  }
)

// Update an existing location
export const updateLocation = createAsyncThunk(
  'locations/updateLocation',
  async ({ tenantId, locationId, locationData }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/api/v1/tenants/${tenantId}/locations/${locationId}`,
        locationData
      )
      return response.data
    } catch (error) {
      console.log(error)
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message)
      }
      return rejectWithValue(error.response.data.message)
    }
  }
)

// Delete a location
export const deleteLocation = createAsyncThunk(
  'locations/deleteLocation',
  async ({ tenantId, locationId }, { rejectWithValue }) => {
    try {
      const res = await api.delete(
        `/api/v1/tenants/${tenantId}/locations/${locationId}`
      )
      return res // Return the ID of the deleted location
    } catch (error) {
      console.log(error)
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message)
      }
      return rejectWithValue(error.response.data.message)
    }
  }
)

const locationApiSlice = createSlice({
  name: 'locationApi',
  initialState: {
    locations: [],
    isLoading: false,
    error: null
  },
  reducers: {
    clearLocationError: state => {
      state.error = null
    }
  },
  extraReducers: builder => {
    builder
      .addCase(getLocations.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getLocations.fulfilled, (state, action) => {
        state.isLoading = false
        state.locations = action.payload
      })
      .addCase(getLocations.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(getLocationsWithAlerts.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getLocationsWithAlerts.fulfilled, (state, action) => {
        state.isLoading = false
        state.locations = action.payload
      })
      .addCase(getLocationsWithAlerts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(createLocation.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createLocation.fulfilled, (state, action) => {
        state.isLoading = false
        state.locations.push(action.payload) // Add new location to the list
      })
      .addCase(createLocation.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(updateLocation.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateLocation.fulfilled, (state, action) => {
        state.isLoading = false
        const updatedLocation = action.payload
        const index = state.locations.findIndex(
          loc => loc.id === updatedLocation.id
        )
        if (index !== -1) {
          state.locations[index] = updatedLocation
        }
      })
      .addCase(updateLocation.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(deleteLocation.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deleteLocation.fulfilled, (state, action) => {
        state.isLoading = false
        state.locations = state.locations.filter(
          location => location.id !== action.payload
        )
      })
      .addCase(deleteLocation.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  }
})

export const { clearLocationError } = locationApiSlice.actions
export default locationApiSlice.reducer

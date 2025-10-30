import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/apihelper'

// Get List of Locations
export const getLocations = createAsyncThunk(
  'locations/getLocations',
  async (tenantId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/v1/tenants/${tenantId}/locations/`)
      
      const locationsArray = Array.isArray(response.data) 
        ? response.data 
        : Array.isArray(response.data) 
        ? response.data 
        : []
      
      return locationsArray
    } catch (error) {
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message)
      }
      return rejectWithValue(error.response.data.message)
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
      .addCase(createLocation.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createLocation.fulfilled, (state, action) => {
        state.isLoading = false
        state.locations.push(action.payload.data) // Add new location to the list
      })
      .addCase(createLocation.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  }
})

export const { clearLocationError } = locationApiSlice.actions
export default locationApiSlice.reducer

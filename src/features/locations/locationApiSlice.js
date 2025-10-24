import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/apihelper'

// Get List of Locations
export const getLocations = createAsyncThunk(
  'locations/getLocations',
  async (tenantId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/v1/tenants/${tenantId}/locations/`)
      console.log('Locations API Response:', response.data)
      
      const locationsArray = Array.isArray(response.data.data) 
        ? response.data.data 
        : Array.isArray(response.data) 
        ? response.data 
        : []
      
      return locationsArray
    } catch (error) {
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message)
      }
      return rejectWithValue(error.message)
    }
  }
)

const locationApiSlice = createSlice({
  name: 'locationApi',
  initialState: {
    locations: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearLocationError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getLocations.pending, (state) => {
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
  },
})

export const { clearLocationError } = locationApiSlice.actions
export default locationApiSlice.reducer

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/apihelper'
import Cookies from 'js-cookie'

// Login user
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/login/access-token', {
        email,
        password
      })
      return response
    } catch (error) {
      if (error.response && error.response.data?.message) {
        return rejectWithValue(error.response.data.message)
      }
      return rejectWithValue(error.message)
    }
  }
)

// Logout user
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/logout')
      return response
    } catch (error) {
      if (error.response && error.response.data?.message) {
        return rejectWithValue(error.response.data.message)
      }
      return rejectWithValue(error.message)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isLoading: false,
    error: null,
    success: false
  },
  reducers: {},
  extraReducers: builder => {
    builder
      // Login cases
      .addCase(loginUser.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.success = true
        state.user = action.payload
        const tenantId = state.user?.data?.data?.tenant_id
        if (tenantId) localStorage.setItem('tenant_id', tenantId)
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Logout cases
      .addCase(logoutUser.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(logoutUser.fulfilled, state => {
        state.isLoading = false
        state.success = false
        state.user = null
        Cookies.remove('access_token')
        localStorage.removeItem('tenant_id')
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  }
})

export default authSlice.reducer

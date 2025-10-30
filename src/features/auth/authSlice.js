import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/apihelper'
import Cookies from 'js-cookie'

// Send OTP
export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/otp/generate-otp', {
        email
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

// Register user (tenant) with OTP
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (
    { companyName, address, fullName, email, password, otp },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/api/v1/tenants/', {
        name: companyName,
        address: address,
        status: 'active',
        meta: {},
        otp: otp,
        admin_user: {
          full_name: fullName,
          email: email,
          role: 'admin',
          password: password
        }
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

// Forgot password
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ tenant_id, email }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/v1/tenants/${tenant_id}/users/password/forgot`,
        {
          email
        }
      )
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
    success: false,
    otpSent: false,
    otpEmail: null
  },
  reducers: {
    clearError: state => {
      state.error = null
    },
    resetOtpState: state => {
      state.otpSent = false
      state.otpEmail = null
    }
  },
  extraReducers: builder => {
    builder
      // Send OTP cases
      .addCase(sendOtp.pending, state => {
        state.isLoading = true
        state.error = null
        state.otpSent = false
      })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.isLoading = false
        state.otpSent = true
        state.otpEmail = action.meta.arg.email
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.otpSent = false
      })

      // Login cases
      .addCase(loginUser.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.success = true
        state.user = action.payload.data
        console.log(action.payload.data)
        console.log(action.payload)
        const tenantId = state.user?.tenant_id
        console.log(tenantId)
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

      // Register cases
      .addCase(registerUser.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        // state.success = true
        state.user = action.payload.data
        state.otpSent = false
        state.otpEmail = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Forgot password cases
      .addCase(forgotPassword.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false
        state.success = true
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  }
})

export const { clearError, resetOtpState } = authSlice.actions
export default authSlice.reducer

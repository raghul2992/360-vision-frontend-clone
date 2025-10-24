import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/apihelper'
import Cookies from 'js-cookie'

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

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isLoading: false,
    error: null,
    success: false
  },
  reducers: {
    logout: state => {
      state.user = null
      state.success = false
      state.error = null
      Cookies.remove('access_token')
      localStorage.removeItem('tenant_id')
    }
  },
  extraReducers: builder => {
    builder
      .addCase(loginUser.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.success = true
        state.user = action.payload
        console.log(state.user.data.data.tenant_id)
        // // Save tenant_id to localStorage
        // localStorage.setItem('tenant_id', action.payload.data.tenant_id)
        localStorage.setItem('tenant_id', state.user.data.data.tenant_id)
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  }
})

export const { logout } = authSlice.actions
export default authSlice.reducer

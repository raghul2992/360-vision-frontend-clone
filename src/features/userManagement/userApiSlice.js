import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/apihelper'

// --- THUNKS ---

// GET: Fetch users
export const fetchTenantsUsers = createAsyncThunk(
  'users/fetchAll',
  async ({ tenant_id, ...params }, { rejectWithValue }) => {
    try {
      // Axios will automatically convert them to a query string (e.g., ?user_id=123&role=admin)
      const response = await api.get(`/api/v1/tenants/${tenant_id}/users/`, {
        params: params
      })
      return response.data
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

// POST: Add new user
export const addNewUser = createAsyncThunk(
  'users/addNew',
  async ({ tenant_id, ...userData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/v1/tenants/${tenant_id}/users/`,
        userData
      )
      return response.data
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

// NEW POST: Invite User
export const inviteUser = createAsyncThunk(
  'users/invite',
  async ({ tenant_id, ...inviteData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/v1/tenants/${tenant_id}/users/invite`,
        inviteData
      )
      return response.data
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

// PUT: Update existing user
export const updateTenantUser = createAsyncThunk(
  'users/update',
  async ({ tenant_id, user_id, ...updateData }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/api/v1/tenants/${tenant_id}/users/${user_id}`,
        updateData
      )
      return response.data
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

// DELETE: Remove user
export const deleteTenantUser = createAsyncThunk(
  'users/delete',
  async ({ tenant_id, user_id }, { rejectWithValue }) => {
    try {
      await api.delete(`/api/v1/tenants/${tenant_id}/users/${user_id}`)
      return user_id
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

// --- SLICE ---

const userSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    isLoading: false,
    isInviting: false, // New state for invitation loading
    isError: null
  },
  reducers: {},
  extraReducers: builder => {
    builder
      // Fetch Users
      .addCase(fetchTenantsUsers.pending, state => {
        state.isLoading = true
      })
      .addCase(fetchTenantsUsers.fulfilled, (state, action) => {
        state.isLoading = false
        state.users = action.payload
      })
      .addCase(fetchTenantsUsers.rejected, (state, action) => {
        state.isLoading = false
        state.isError = action.payload
      })

      // Add User
      .addCase(addNewUser.fulfilled, (state, action) => {
        state.users.push(action.payload)
      })

      // Invite User (NEW)
      .addCase(inviteUser.pending, state => {
        state.isInviting = true
      })
      .addCase(inviteUser.fulfilled, state => {
        state.isInviting = false
        // Note: Inviting doesn't usually add to the user list until they accept.
        // If your API returns the invited user, you can push it here:
        // state.users.push(action.payload)
      })
      .addCase(inviteUser.rejected, (state, action) => {
        state.isInviting = false
        state.isError = action.payload
      })

      // Update User
      .addCase(updateTenantUser.fulfilled, (state, action) => {
        state.users = state.users.map(u =>
          u.id === action.payload.id ? action.payload : u
        )
      })

      // Delete User
      .addCase(deleteTenantUser.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u.id !== action.payload)
      })
  }
})

export default userSlice.reducer

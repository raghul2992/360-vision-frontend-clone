import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/apihelper";

// Fetch all tenants (superadmin only)
export const fetchTenants = createAsyncThunk(
  "admin/fetchTenants",
  async ({ skip = 0, limit = 100 }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/v1/tenants/?skip=${skip}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      if (error.response && error.response.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue(error.message);
    }
  }
);

// Update tenant status (superadmin only)
export const updateTenantStatus = createAsyncThunk(
  "admin/updateTenantStatus",
  async ({ tenant_id, status }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/v1/tenants/${tenant_id}`, {
        status: status,
      });
      return { tenant_id, status, data: response.data };
    } catch (error) {
      if (error.response && error.response.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue(error.message);
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    tenants: [],
    tenantsLoading: false,
    updateLoading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tenants cases
      .addCase(fetchTenants.pending, (state) => {
        state.tenantsLoading = true;
        state.error = null;
      })
      .addCase(fetchTenants.fulfilled, (state, action) => {
        state.tenantsLoading = false;
        state.tenants = action.payload;
      })
      .addCase(fetchTenants.rejected, (state, action) => {
        state.tenantsLoading = false;
        state.error = action.payload;
      })

      // Update tenant status cases
      .addCase(updateTenantStatus.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateTenantStatus.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.success = true;
        // Update the tenant in the local state
        const index = state.tenants.findIndex(
          (tenant) => tenant.id === action.payload.tenant_id
        );
        if (index !== -1) {
          state.tenants[index].status = action.payload.status;
        }
      })
      .addCase(updateTenantStatus.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { clearError, clearSuccess } = adminSlice.actions;
export default adminSlice.reducer;

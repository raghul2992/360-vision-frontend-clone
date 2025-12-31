import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../utils/apihelper'

export const fetchOverviewReports = createAsyncThunk(
  'reports/fetchOverview',
  async ({ tenant_id, params = {} }) => {
    const [alertsCount, mostFrequent, busiestHour, avgDwell] =
      await Promise.all([
        api.get(`/api/v1/tenants/${tenant_id}/reports/alerts/count`, {
          params
        }),
        api.get(`/api/v1/tenants/${tenant_id}/reports/alerts/most_frequent`, {
          params
        }),
        api.get(`/api/v1/tenants/${tenant_id}/reports/busiest_hour`, {
          params
        }),
        api.get(`/api/v1/tenants/${tenant_id}/reports/average_dwell_time`, {
          params
        })
      ])

    return {
      alertsCount: alertsCount.data,
      mostFrequent: mostFrequent.data,
      busiestHour: busiestHour.data,
      avgDwell: avgDwell.data
    }
  }
)

const reportsSlice = createSlice({
  name: 'reports',
  initialState: {
    overview: null,
    isLoading: false
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchOverviewReports.pending, state => {
        state.isLoading = true
      })
      .addCase(fetchOverviewReports.fulfilled, (state, action) => {
        state.overview = action.payload
        state.isLoading = false
        console.log('overview', state.overview)
      })
      .addCase(fetchOverviewReports.rejected, state => {
        state.isLoading = false
      })
  }
})

export default reportsSlice.reducer

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../utils/apihelper";

export const fetchOverviewReports = createAsyncThunk(
  "reports/fetchOverview",
  async ({ tenant_id, params = {} }) => {
    // Process params to handle location_ids array
    // We need to convert the params object into URLSearchParams to handle arrays correctly
    // because Axios params serializer might vary. Manual construction ensures consistency.

    const buildQueryString = (baseParams) => {
      const sp = new URLSearchParams();
      Object.keys(baseParams).forEach((key) => {
        if (key === "location_ids" && Array.isArray(baseParams[key])) {
          baseParams[key].forEach((id) => sp.append("location_ids", id));
        } else if (baseParams[key] !== undefined && baseParams[key] !== null) {
          sp.append(key, baseParams[key]);
        }
      });
      return sp;
    };

    const queryParams = buildQueryString(params);

    const [alertsCount, mostFrequent, busiestHour, avgDwell, avgCustomerQueueTime, customerPeakTime, visitorTraffic] =
      await Promise.all([
        api.get(`/api/v1/tenants/${tenant_id}/reports/alerts/count`, {
          params: queryParams,
        }),
        api.get(`/api/v1/tenants/${tenant_id}/reports/alerts/most_frequent`, {
          params: queryParams,
        }),
        api.get(`/api/v1/tenants/${tenant_id}/reports/busiest_hour`, {
          params: queryParams,
        }),
        api.get(`/api/v1/tenants/${tenant_id}/reports/average_dwell_time`, {
          params: queryParams,
        }),
        api.get(
          `/api/v1/tenants/${tenant_id}/reports/kpi/avg-customer-queue-time`,
          { params: queryParams },
        ),
        api.get(`/api/v1/tenants/${tenant_id}/reports/kpi/customer-peak-time`, {
          params: queryParams,
        }),
        api.get(`/api/v1/tenants/${tenant_id}/reports/kpi/visitor-traffic`, {
          params: queryParams,
        }),
      ]);

    return {
      alertsCount: alertsCount.data,
      mostFrequent: mostFrequent.data,
      busiestHour: busiestHour.data,
      avgDwell: avgDwell.data,
      avgCustomerQueueTime: avgCustomerQueueTime.data,
      customerPeakTime: customerPeakTime.data,
      visitorTraffic: visitorTraffic.data,
    };
  },
);

const reportsSlice = createSlice({
  name: "reports",
  initialState: {
    overview: null,
    isLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOverviewReports.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOverviewReports.fulfilled, (state, action) => {
        state.overview = action.payload;
        state.isLoading = false;
        console.log("overview", state.overview);
      })
      .addCase(fetchOverviewReports.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export default reportsSlice.reducer;

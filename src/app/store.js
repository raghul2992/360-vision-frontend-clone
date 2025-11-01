import { configureStore } from '@reduxjs/toolkit'

import roilistReducer from '../features/cameras/roilistslice'
import authReducer from '../features/auth/authSlice'
import cameraApiReducer from '../features/cameras/cameraApiSlice'
import locationApiReducer from '../features/locations/locationApiSlice'
import alertsReducer from '../features/alert/alertsslice'

export const store = configureStore({
  reducer: {
    roilist: roilistReducer,
    auth: authReducer,
    cameraApi: cameraApiReducer,
    locationApi: locationApiReducer,
    alerts: alertsReducer
  }
})

export default store

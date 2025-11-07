import { configureStore } from '@reduxjs/toolkit'

import roilistReducer from '../features/cameras/roilistslice'
import authReducer from '../features/auth/authSlice'
import cameraApiReducer from '../features/cameras/cameraApiSlice'
import locationApiReducer from '../features/locations/locationApiSlice'
import notificationReducer from '../features/notification/notificationSlice'
import alertReducer from '../features/alert/alertSlice'

export const store = configureStore({
  reducer: {
    roilist: roilistReducer,
    auth: authReducer,
    cameraApi: cameraApiReducer,
    locationApi: locationApiReducer,
    notifications: notificationReducer,
    alerts: alertReducer
  }
})

export default store

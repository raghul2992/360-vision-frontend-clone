import { createSlice } from '@reduxjs/toolkit'
import { toast } from 'react-toastify'

const initialState = {
  alerts: [
    {
      id: 1,
      camera: 'Câmera 01 | Posto 2 de Alfenas/MG',
      type: 'Possível arma branca',
      date: '04 de Abril de 2025',
      status: 'confirmed',
      icon: 'weapon',
      timestamp: '2025-04-04T10:30:00'
    },
    {
      id: 2,
      camera: 'Câmera 01 | Posto 2 de Alfenas/MG',
      type: 'Possível arma branca',
      date: '04 de Abril de 2025',
      status: 'active',
      icon: 'weapon',
      timestamp: '2025-04-04T10:25:00'
    },
    {
      id: 3,
      camera: 'Câmera 01 | Posto 2 de Alfenas/MG',
      type: 'Possível arma branca',
      date: '04 de Abril de 2025',
      status: 'confirmed',
      icon: 'weapon',
      timestamp: '2025-04-04T10:20:00'
    },
    {
      id: 4,
      camera: 'Câmera 01 | Posto 2 de Alfenas/MG',
      type: 'Possível arma branca',
      date: '04 de Abril de 2025',
      status: 'active',
      icon: 'weapon',
      timestamp: '2025-04-04T10:15:00'
    },
    {
      id: 5,
      camera: 'Câmera 01 | Posto 2 de Alfenas/MG',
      type: 'Possível arma branca',
      date: '04 de Abril de 2025',
      status: 'confirmed',
      icon: 'weapon',
      timestamp: '2025-04-04T10:10:00'
    }
  ],
  statistics: {
    carros: 8,
    onibus: 12,
    motos: 18,
    caminhao: 15
  },
  // WebSocket connection status (for future implementation)
  wsConnected: false,
  wsError: null
}

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    addAlert: (state, action) => {
      state.alerts.unshift(action.payload)
    },
    updateAlertStatus: (state, action) => {
      const { id, status } = action.payload
      const alert = state.alerts.find(a => a.id === id)
      if (alert) {
        alert.status = status
      }
    },
    removeAlert: (state, action) => {
      state.alerts = state.alerts.filter(a => a.id !== action.payload)
    },
    updateStatistics: (state, action) => {
      state.statistics = { ...state.statistics, ...action.payload }
    },
    setWsConnected: (state, action) => {
      state.wsConnected = action.payload
    },
    setWsError: (state, action) => {
      state.wsError = action.payload
    },
    // Future WebSocket handler
    handleWebSocketMessage: (state, action) => {
      const { type, message, data } = action.payload
      switch (type) {
        case 'event_alert':
          state.alerts.unshift(data)
          break
        case 'camera_status':
          break
        default:
          console.warn('Unknown WebSocket message type:', type, data)
          break
      }
    }
  }
})

export const {
  addAlert,
  updateAlertStatus,
  removeAlert,
  updateStatistics,
  setWsConnected,
  setWsError,
  handleWebSocketMessage
} = alertsSlice.actions

export default alertsSlice.reducer

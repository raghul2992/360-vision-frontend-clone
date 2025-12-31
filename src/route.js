import AuthPage from './pages/auth'
import ResetPasswordPage from './pages/auth/reset-password'
import ForgotPasswordPage from './pages/auth/ForgotPassword'
import Dashboard from './pages/dashboard'
import AddCamera from './pages/cameras/AddCamera'
import ROIConfiguration from './pages/cameras/ROIConfiguration'
import CameraPage from './pages/cameras/CameraPage'
import LocationManagementPage from './pages/locations/LocationManagementPage'
import DashboardHome from './pages/dashboardhome/DashboardHome'
import NotFound from './pages/NotFound'
import ProtectedRoute from './utils/ProtectedRoute'

export const routes = [
  // --- PUBLIC ROUTES (No Cookie Check) ---
  {
    path: '/',
    element: <AuthPage />
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />
  },

  // --- PROTECTED ROUTES (Cookie Check Required) ---
  {
    element: <ProtectedRoute />, // The Gatekeeper
    children: [
      {
        element: <Dashboard />, // The Layout
        children: [
          {
            path: '/dashboard',
            element: <DashboardHome />
          },
          {
            path: '/location',
            element: <LocationManagementPage />
          },
          {
            path: '/camera',
            element: <CameraPage />
          },
          {
            path: '/add-camera',
            element: <AddCamera />
          },
          {
            path: '/roi-configuration',
            element: <ROIConfiguration />
          }
        ]
      }
    ]
  },

  // --- 404 CATCH-ALL ---
  {
    path: '*',
    element: <NotFound />
  }
]

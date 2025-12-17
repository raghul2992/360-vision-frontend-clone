import AuthPage from './pages/auth'
import ResetPasswordPage from './pages/auth/reset-password'
import ForgotPasswordPage from './pages/auth/ForgotPassword'
import Dashboard from './pages/dashboard'
// import CameraGrid from './pages/cameras/CameraGrid'
import AddCamera from './pages/cameras/AddCamera'
import ROIConfiguration from './pages/cameras/ROIConfiguration'
// import CameraList from './pages/cameras/CameraList'
import CameraPage from './pages/cameras/CameraPage'
import LocationManagementPage from './pages/locations/LocationManagementPage'
import DashboardHome from './pages/dashboardhome/DashboardHome'
import NotFound from './pages/NotFound'

export const routes = [
  {
    path: '*',
    element: <NotFound />
  },
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
  {
    element: <Dashboard />,
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
        path: '/add-camera', // absolute path
        element: <AddCamera />
      },
      {
        path: '/roi-configuration', // absolute path
        element: <ROIConfiguration />
      }
    ]
  }
]

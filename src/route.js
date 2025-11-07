import AuthPage from './pages/auth'
import ResetPasswordPage from './pages/auth/reset-password'
import Dashboard from './pages/dashboard'
// import CameraGrid from './pages/cameras/CameraGrid'
import AddCamera from './pages/cameras/AddCamera'
import ROIConfiguration from './pages/cameras/ROIConfiguration'
// import CameraList from './pages/cameras/CameraList'
import CameraPage from './pages/cameras/CameraPage'
import DashboardHome from './pages/dashboardhome/DashboardHome'

export const routes = [
  {
    path: '/',
    element: <AuthPage />
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />
  },
  {
    element: <Dashboard />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardHome />
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

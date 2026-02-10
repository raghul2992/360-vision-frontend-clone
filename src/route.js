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
import UserManagement from './pages/usesManagement/userManagement'
import AdminTenants from './pages/superadmin/AdminTenants'
import AdminProtectedRoute from './utils/adminProtectedRoutes'
import Alerts from './pages/dashboardhome/alerts'

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
  {
    path: '/accept-invitation',
    element: <ResetPasswordPage acceptinvitation={true} />
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
          },
          {
            path: 'user-management',
            element: <UserManagement />
          },
          {
            path:'/alerts',
            element:<Alerts/>
          }
        ]
      }
    ]


  },
  {
  element: <AdminProtectedRoute />, 
        children: [
          {
            element: <Dashboard />, 
            children: [
              {
                path: '/admin/tenants',
                element: <AdminTenants />
              }
            
            ]
          }
        ]
      },


// create a admin protected route and that is only accessable by superadmin 
//admin/tenants

// role type



  // --- 404 CATCH-ALL ---
  {
    path: '*',
    element: <NotFound />
  }
]

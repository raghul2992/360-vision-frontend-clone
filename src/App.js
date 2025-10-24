import './App.css'
import {
  BrowserRouter as Router,
  useLocation,
  useRoutes
} from 'react-router-dom'
import { routes } from './route'
import FloatingLanguageButton from './component/FloatingLanguageButton'
import { Provider } from 'react-redux'
import store from './app/store'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function AppRoutes () {
  const element = useRoutes(routes)
  return element
}

function App () {
  return (
    <Provider store={store}>
      <div className='font-sans'>
        <Router>
          <ToastContainer />
          <MainApp />
        </Router>
      </div>
    </Provider>
  )
}

function MainApp () {
  const location = useLocation()

  // Hide the Floating Button on ALL dashboard-related routes
  const dashboardPaths = [
    '/admin-dashboard',
    '/camera-setup',
    '/add-camera',
    '/roi-configuration'
  ]

  const hideFloatingButton = dashboardPaths.some(path =>
    location.pathname.startsWith(path)
  )

  return (
    <>
      <AppRoutes />
      {!hideFloatingButton && <FloatingLanguageButton />}
    </>
  )
}

export default App

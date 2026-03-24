import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

const ProtectedRoute = () => {
  const location = useLocation()
  const tenantId = localStorage.getItem('tenant_id')

  return tenantId ? (
    <Outlet />
  ) : (
    <Navigate
      to={`/?redirect=${encodeURIComponent(location.pathname + location.search)}`}
      replace
    />
  )
}

export default ProtectedRoute
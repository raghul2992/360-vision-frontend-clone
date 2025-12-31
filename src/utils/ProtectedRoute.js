import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute = () => {
  // 1. Get the tenant_id directly from localStorage
  const tenantId = localStorage.getItem('tenant_id')

  return tenantId ? <Outlet /> : <Navigate to='/' replace />
}

export default ProtectedRoute

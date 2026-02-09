import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const AdminProtectedRoute = () => {
  const userRole = localStorage.getItem("user_role");

  // Only superadmin can access
  return userRole === "superadmin" ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export default AdminProtectedRoute;

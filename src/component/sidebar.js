import React, { useEffect, useState } from "react";
import company_logo from "../assets/company-icon.png";
import { textcolors,bgcolors } from "../theme";
import {
  IoHomeOutline,
  IoLocationOutline,
  IoCameraOutline,
  IoSettingsOutline,
  IoLogOutOutline,
  IoPeopleOutline,
  IoBusinessOutline, // For Tenant Switch
  IoFileTrayFullOutline
} from "react-icons/io5";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../features/auth/authSlice";

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve user info
  const userRole = localStorage.getItem("user_role");
  const tenantId = localStorage.getItem("tenant_id");

  // State to track if tenant is selected
  const [hasTenantSelected, setHasTenantSelected] = useState(false);

  useEffect(() => {
    setHasTenantSelected(!!tenantId && userRole === "superadmin");
  }, [tenantId, userRole]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      localStorage.removeItem("tenant_id");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_id");
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.clear();
      navigate("/");
    }
  };

  // Navigate to tenant selection and clear current tenant selection
  const handleTenantSwitch = () => {
    localStorage.removeItem("tenant_id");
    navigate("/tenants");
  };

  const standardClass = `sticky ${bgcolors.white} border-r border-solid border-[#DDDDDD] w-[100px] h-screen flex flex-col items-center py-3`;
  // Theme-consistent active class helper
  const isActive = (path) =>
    location.pathname === path ? "rounded-[16px] active-menu" : "";

  // 1. CONDITIONAL VIEW: Superadmin without a tenant selected
  if (userRole === "superadmin" && !hasTenantSelected) {
    return (
      <div className={standardClass}>
        <div className="flex justify-center items-center mb-4">
          <img src={company_logo} alt="logo" className="w-[80px] h-[80px] object-contain" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <Link to="/tenants">
            <div className={`menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px] ${isActive("/tenants")}`}>
              <IoBusinessOutline className="text-2xl" />
            </div>
          </Link>
        </div>

        <div className="menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px]">
          <IoLogOutOutline className="text-2xl" onClick={handleLogout} />
        </div>
      </div>
    );
  }

  // 2. STANDARD VIEW: Regular users or Superadmin with tenant selected
  return (
    <div className={`sticky ${bgcolors.white} border-r border-solid border-[#DDDDDD] w-[100px] h-screen flex flex-col items-center py-3`}>
      {/* Logo */}
      <div className="flex justify-center items-center mb-4">
        <img src={company_logo} alt="logo" className="w-[80px] h-[80px] object-contain" />
      </div>

      <div className="flex flex-col items-center justify-center flex-1 gap-5 text-xl">
        
        {/* Tenant Switcher - Only Superadmin sees this inside the full menu */}
        {userRole === "superadmin" && hasTenantSelected && (
          <div
            onClick={handleTenantSwitch}
            className={`menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px] ${isActive("/tenants")}`}
          >
            <IoBusinessOutline className="text-2xl" />
          </div>
        )}

        {/* Dashboard */}
        <Link to="/dashboard">
          <div className={`menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px] ${isActive("/dashboard")}`}>
            <IoHomeOutline className="text-2xl" />
          </div>
        </Link>

        {/* Location */}
        {/* <Link to="/location">
          <div className={`menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px] ${isActive("/location")}`}>
            <IoLocationOutline className="text-2xl" />
          </div>
        </Link> */}

        {/* Camera - Restricted */}
        {userRole !== "viewer" && (
          <Link to="/camera">
            <div className={`menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px] ${isActive("/camera")}`}>
              <IoCameraOutline className="text-2xl" />
            </div>
          </Link>
        )}
     
        {/* User Management - Restricted */}
        {userRole !== "viewer" && (
          <Link to="/user-management">
            <div className={`menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px] ${isActive("/user-management")}`}>
              <IoPeopleOutline className="text-2xl" />
            </div>
          </Link>
        )}


         <Link to="/alerts">
          <div className={`menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px] ${isActive("/alerts")}`}>
            <IoFileTrayFullOutline className="text-2xl" />
          </div>
        </Link>
      </div>

     




      {/* Logout */}
      <div className="menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px]">
        <IoLogOutOutline className="text-2xl" onClick={handleLogout} />
      </div>
    </div>
  );
};

export default Sidebar;
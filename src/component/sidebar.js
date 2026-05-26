import React, { useEffect, useState } from "react";
import company_logo from "../assets/company-icon.png";
import { bgcolors, borderstyles, colors, iconSizes, textcolors } from "../theme";
import { Tooltip } from "@mui/material";
import {
  BuildingIcon,
  HomeIcon,
  CameraIcon,
  WarningIcon,
  CloseIcon,
} from "../icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useWebSocket from "../hooks/useWebSocket";

const WsStatusDot = ({ wsStatus }) => {
  const connected = wsStatus === "connected";
  return (
    <Tooltip title={connected ? "Realtime: Connected" : "Realtime: Disconnected"} placement="right">
      <div
        className="w-9 h-9 rounded-[12px] flex items-center justify-center mb-2 cursor-default"
        style={{ background: connected ? colors.wsConnectedBg : colors.wsDisconnectedBg }}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full ${connected ? bgcolors.success : bgcolors.danger}`}
        />
      </div>
    </Tooltip>
  );
};

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve user info
  const userRole = localStorage.getItem("user_role");
  const tenantId = localStorage.getItem("tenant_id");

  const [hasTenantSelected, setHasTenantSelected] = useState(false);
  const [wsStatus, setWsStatus] = useState("disconnected");

  useEffect(() => {
    setHasTenantSelected(!!tenantId && userRole === "superadmin");
  }, [tenantId, userRole]);

  const wsUrl = tenantId
    ? `${process.env.REACT_APP_BASE_URL}/ws/${tenantId}`
    : null;
  const { isConnected } = useWebSocket(wsUrl, tenantId);

  useEffect(() => {
    setWsStatus(isConnected ? "connected" : "disconnected");
  }, [isConnected]);

  // Navigate to tenant selection and clear current tenant selection
  const handleTenantSwitch = () => {
    localStorage.removeItem("tenant_id");
    navigate("/tenants");
  };

  const standardClass = `
    fixed z-50 ${bgcolors.white} border-solid ${borderstyles.sidebar} w-[80px] h-full flex flex-col items-center py-3
    transition-transform duration-300 ease-in-out
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
    md:sticky md:translate-x-0 md:h-screen md:z-auto
  `;
  // Theme-consistent active class helper
  const isActive = (path) =>
    location.pathname === path ? "rounded-[16px] active-menu" : "";

  // 1. CONDITIONAL VIEW: Superadmin without a tenant selected
  if (userRole === "superadmin" && !hasTenantSelected) {
    return (
      <div className={standardClass}>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className={`md:hidden self-end mr-2 mb-2 p-1 rounded-lg ${textcolors.dim} ${bgcolors.hoverLight} transition-colors`}
          aria-label="Close sidebar"
        >
          <CloseIcon size={iconSizes.button} />
        </button>

        <div className="flex justify-center items-center mb-4">
          <img src={company_logo} alt="logo" className="w-[80px] h-[80px] object-contain" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <Tooltip title="Tenants" placement="right">
            <Link to="/tenants">
              <div className={`menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px] ${isActive("/tenants")}`}>
                <BuildingIcon size={iconSizes.sidebar} />
              </div>
            </Link>
          </Tooltip>
        </div>

        <WsStatusDot wsStatus={wsStatus} />
      </div>
    );
  }

  // 2. STANDARD VIEW: Regular users or Superadmin with tenant selected
  return (
    <div className={standardClass}>
      {/* Mobile close button */}
      <button
        onClick={onClose}
        className={`md:hidden self-end mr-2 mb-2 p-1 rounded-lg ${textcolors.dim} hover:bg-gray-100 transition-colors`}
        aria-label="Close sidebar"
      >
        <CloseIcon size={18} />
      </button>

      {/* Logo */}
      <div className="flex justify-center items-center mb-4">
        <img src={company_logo} alt="logo" className="w-[80px] h-[80px] object-contain" />
      </div>

      <div className="flex flex-col items-center justify-center flex-1 gap-5 text-xl">

        {/* Tenant Switcher - Only Superadmin sees this inside the full menu */}
        {userRole === "superadmin" && hasTenantSelected && (
          <Tooltip title="Tenants" placement="right">
            <div
              onClick={handleTenantSwitch}
              className={`menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px] ${isActive("/tenants")}`}
            >
              <BuildingIcon size={iconSizes.sidebar} />
            </div>
          </Tooltip>
        )}

        {/* Dashboard */}
        <Tooltip title="Home" placement="right">
          <Link to="/dashboard">
            <div className={`menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px] ${isActive("/dashboard")}`}>
              <HomeIcon size={iconSizes.sidebar} />
            </div>
          </Link>
        </Tooltip>

        {/* Camera - Restricted */}
        {userRole !== "viewer" && (
          <Tooltip title="Camera" placement="right">
            <Link to="/camera">
              <div className={`menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px] ${isActive("/camera")}`}>
                <CameraIcon size={iconSizes.sidebar} />
              </div>
            </Link>
          </Tooltip>
        )}

        <Tooltip title="Alerts" placement="right">
          <Link to="/alerts">
            <div className={`menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px] ${isActive("/alerts")}`}>
              <WarningIcon size={iconSizes.sidebar} />
            </div>
          </Link>
        </Tooltip>
      </div>

     




      <WsStatusDot wsStatus={wsStatus} />
    </div>
  );
};

export default Sidebar;
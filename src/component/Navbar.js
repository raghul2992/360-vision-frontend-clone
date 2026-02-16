// components/Navbar.js
import React, { useState, useEffect } from "react";
import { IoGlobeOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import { bgcolors, textcolors } from "../theme";
import NotificationBell from "./NotificationBell";
import useWebSocket from "../hooks/useWebSocket";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../features/notification/notificationSlice";
import { Tooltip } from "@mui/material";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [wsStatus, setWsStatus] = useState("disconnected"); // Track status locally
  const selectedTenantName = localStorage.getItem("tenant_name");
   const location = useLocation();

  const isAdminPage = location.pathname.startsWith("/tenants");

  const dispatch = useDispatch();
  const { unreadCount } = useSelector((state) => state.notifications);

  const tenantId = localStorage.getItem("tenant_id");
  const wsUrl = tenantId
    ? `${process.env.REACT_APP_BASE_URL}/ws/${tenantId}`
    : null;

  const { isConnected, error } = useWebSocket(wsUrl, tenantId);

  // Fetch notifications on mount
  // useEffect(() => {
  //   if (tenantId) {
  //     dispatch(fetchNotifications({ tenantId }))
  //   }
  // }, [dispatch, tenantId])

  // Update local WebSocket status
  useEffect(() => {
    setWsStatus(isConnected ? "connected" : "disconnected");
    console.log(
      "WebSocket status updated:",
      isConnected ? "connected" : "disconnected",
    );
  }, [isConnected]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  return (
    <div
      className={` ${bgcolors.white}  h-16 flex items-center justify-between px-6`}
    >
      {/* LEFT SIDE */}
      <div className="flex items-center">
        {selectedTenantName && !isAdminPage && (
          <h1 className="text-sm md:text-base bg-[#3885CC]/20 border border-[#3885CC]/30 px-3 py-1 rounded-md uppercase tracking-widest font-bold ">
            {selectedTenantName}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* WebSocket Connection Indicator */}
        <Tooltip
          title={
            wsStatus === "connected"
              ? t("realtime_sync.connected_title")
              : `${t("realtime_sync.disconnected_title")} ${
                  error ? `- ${error}` : ""
                }`
          }
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full transition-colors ${
                wsStatus === "connected" ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>

            <span className={`text-xs font-semibold ${textcolors.dark}`}>
              {wsStatus === "connected"
                ? t("realtime_sync.connected_text")
                : t("realtime_sync.disconnected_text")}
            </span>
          </div>
        </Tooltip>
        {/* Language Selector */}
        {/* <div className='relative'>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className='flex items-center gap-2 p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors'
          >
            <IoGlobeOutline size={20} className='text-white' />
            <span className='text-sm font-medium'>
              {i18n.language.toUpperCase()}
            </span>
          </button>

          {isOpen && (
            <div className='absolute top-12 right-0 bg-gray-800 border border-gray-700 rounded-md shadow-lg w-36 text-white z-50'>
              <button
                onClick={() => changeLanguage('en')}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  i18n.language === 'en'
                    ? 'bg-gray-700 font-semibold'
                    : 'hover:bg-gray-700'
                }`}
              >
                English
              </button>
              <button
                onClick={() => changeLanguage('pt')}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  i18n.language === 'pt'
                    ? 'bg-gray-700 font-semibold'
                    : 'hover:bg-gray-700'
                }`}
              >
                Português
              </button>
            </div>
          )}
        </div> */}

        {/* Notification Bell Component */}
        <NotificationBell unreadCount={unreadCount} />
      </div>
    </div>
  );
};

export default Navbar;

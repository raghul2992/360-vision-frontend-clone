import React, { useState, useEffect, useRef } from "react";
import { colors, gradients, shadows, bgcolors, textcolors, borderstyles, iconSizes } from "../theme";
import { useTranslation } from "react-i18next";
import NotificationBell from "./NotificationBell";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { logoutUser } from "../features/auth/authSlice";
import { MenuIcon, UserIcon, SettingsIcon, PeopleIcon, LogoutIcon } from "../icons";

const PAGE_TITLES = {
  "/tenants": "Tenant Management",
  "/dashboard": "Dashboard",
  "/alerts": "Alerts",
  "/camera": "Cameras",
  "/user-management": "User Management",
  "/settings": "Settings",
  "/analytics": "Analytics",
};

const Navbar = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { unreadCount } = useSelector((state) => state.notifications);
  const user = useSelector((state) => state.auth?.user);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pageTitle =
    Object.entries(PAGE_TITLES).find(([path]) =>
      location.pathname.startsWith(path)
    )?.[1] ?? "Dashboard";

  const userRole = user?.role ?? localStorage.getItem("user_role") ?? "";
  const isSuperAdmin = userRole === "superadmin" || userRole === "super_admin";
  const isViewer = userRole === "viewer";

  const fullName = user?.full_name ?? "";
  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : isSuperAdmin
    ? "SA"
    : (fullName[0] ?? "U").toUpperCase();

  const roleLabel = isSuperAdmin
    ? "Super Admin"
    : userRole
    ? userRole.charAt(0).toUpperCase() + userRole.slice(1)
    : "Admin";

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (_) {}
    localStorage.removeItem("tenant_id");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    navigate("/");
  };

  const handleNav = (path) => {
    setDropdownOpen(false);
    navigate(path);
  };

  return (
    <div
      className={`flex items-center justify-between px-6 ${bgcolors.white} ${borderstyles.tableHeader}`}
      style={{ height: "72px" }}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className={`md:hidden p-2 rounded-lg ${textcolors.dim} ${bgcolors.hoverLight} transition-colors mr-2`}
      >
        <MenuIcon size={iconSizes.sidebar} />
      </button>

      {/* LEFT — tenant name (hidden on tenants page) */}
      {(() => {
        const tenantName = localStorage.getItem('tenant_name')
        return tenantName && !location.pathname.startsWith('/tenants') ? (
          <div
            className="px-4 py-1.5 rounded-lg border"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border
            }}
          >
            <span
              className="text-[13px] font-extrabold uppercase tracking-widest"
              style={{ color: colors.text }}
            >
              {tenantName}
            </span>
          </div>
        ) : <div />
      })()}

      {/* RIGHT */}
      <div className="flex items-center gap-2 sm:gap-5">
        {/* Notification Bell — hidden on Tenant Management page */}
        {!location.pathname.startsWith("/tenants") && (
          <NotificationBell unreadCount={unreadCount} />
        )}

        {/* Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full focus:outline-none group"
            aria-label="Open profile menu"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background: gradients.accent,
                boxShadow: dropdownOpen ? shadows.button : "none",
              }}
            >
              <span className={`${textcolors.white} text-xs font-bold`}>{initials}</span>
            </div>
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-2xl z-50 overflow-hidden"
              style={{
                background: colors.panel,
                border: `1px solid ${colors.border}`,
                boxShadow: shadows.cardHover,
                top: "100%",
              }}
            >
              {/* Profile header */}
              <div
                className="px-4 py-3 border-b"
                style={{ borderColor: colors.border }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: gradients.accent }}
                  >
                    <span className={`${textcolors.white} text-xs font-bold`}>{initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: colors.text }}>
                      {fullName || roleLabel}
                    </p>
                    <p className="text-[11px] font-medium" style={{ color: colors.textMute }}>
                      {roleLabel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                <DropdownItem icon={<UserIcon size={iconSizes.dropdown} />} label="My Profile" onClick={() => setDropdownOpen(false)} />
                <DropdownItem icon={<SettingsIcon size={iconSizes.dropdown} />} label="Settings" onClick={() => handleNav("/settings")} />
                {!isViewer && !location.pathname.startsWith("/tenants") && (
                  <DropdownItem icon={<PeopleIcon size={iconSizes.dropdown} />} label="User Management" onClick={() => handleNav("/user-management")} />
                )}
              </div>

              {/* Divider + Logout */}
              <div style={{ borderTop: `1px solid ${colors.border}` }} className="py-1.5">
                <DropdownItem icon={<LogoutIcon size={iconSizes.dropdown} />} label="Logout" onClick={handleLogout} danger />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DropdownItem = ({ icon, label, onClick, danger = false }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors"
      style={{
        background: hovered
          ? danger
            ? colors.dangerSubtle
            : colors.accentSubtle
          : "transparent",
        color: hovered
          ? danger ? colors.dangerDark : colors.accentDark
          : danger ? colors.danger : colors.textDim,
        fontSize: "13px",
        fontWeight: 500,
      }}
    >
      <span style={{ flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  );
};

export default Navbar;

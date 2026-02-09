import React from 'react';
import { useTranslation } from 'react-i18next';

const StatusToggle = ({ status, onStatusChange, tenantId }) => {
  const { t } = useTranslation();
  const isActive = status === "active";

  const handleToggle = (e) => {
    e.stopPropagation();
    const newStatus = e.target.checked ? "active" : "inactive";
    onStatusChange(tenantId, newStatus, e);
  };

  return (
    <div
      className="flex items-center gap-3 px-6"
      onClick={(e) => e.stopPropagation()}
    >
      <span 
        className={`text-xs font-medium transition-colors ${
          !isActive ? "text-gray-300" : "text-gray-500"
        }`}
      >
        {t("admin.inactive")}
      </span>
      
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={handleToggle}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
      </label>
      
      <span 
        className={`text-xs font-medium transition-colors ${
          isActive ? "text-green-400" : "text-gray-500"
        }`}
      >
        {t("admin.active")}
      </span>
    </div>
  );
};

export default StatusToggle;

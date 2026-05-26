import React from 'react';
import { useTranslation } from 'react-i18next';
import { bgcolors, borderstyles } from '../theme';

const StatusToggle = ({ status, onStatusChange, tenantId }) => {
  const { t } = useTranslation();
  const isActive = status === "active";

  const handleToggle = (e) => {
    e.stopPropagation();
    const newStatus = e.target.checked ? "active" : "inactive";
    onStatusChange(tenantId, newStatus, e);
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={handleToggle}
          className="sr-only peer"
        />
        <div className={`w-11 h-6 ${bgcolors.toggleInactive} ${borderstyles.peerFocusAccent} rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] ${bgcolors.toggleKnob} after:rounded-full after:h-5 after:w-5 after:transition-all ${bgcolors.toggleActive} shadow-inner`}></div>
      </label>
    </div>
  );
};

export default StatusToggle;

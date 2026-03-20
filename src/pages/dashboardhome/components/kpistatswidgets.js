import React from "react";
import { FiX, FiMaximize2, FiInfo } from "react-icons/fi";
import FilterDropdown from "../../../component/FilterDropdown"; // Adjust path if needed
import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { MdDragIndicator } from "react-icons/md";
const KpiWidget = ({
  title,
  value,
  subText,
  subIcon,
  infoText,
  subClass,
  onExpand,
  onRemove,
  filterProps, // Receives all filter props specifically for this card
}) => {
  const isLongText = typeof value === "string" && value.length > 8;
  const [showInfo, setShowInfo] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const infoBtnRef = useRef(null);

  const updateTooltipPosition = () => {
    if (!infoBtnRef.current) return;
    const rect = infoBtnRef.current.getBoundingClientRect();
    const tooltipWidth = 280;
    let top = rect.top + window.scrollY;
    let left = rect.right + window.scrollX + 8;
    if (left + tooltipWidth > window.scrollX + window.innerWidth - 8) {
      left = rect.left + window.scrollX - tooltipWidth - 8;
    }
    setTooltipPos({ top, left });
  };
  useEffect(() => {
    if (!showInfo) return;
    updateTooltipPosition();
    window.addEventListener("scroll", updateTooltipPosition, true);
    window.addEventListener("resize", updateTooltipPosition);
    return () => {
      window.removeEventListener("scroll", updateTooltipPosition, true);
      window.removeEventListener("resize", updateTooltipPosition);
    };
  }, [showInfo]);

  return (
    <div className="bg-[#2a2f45] rounded-lg p-4 flex flex-col justify-between h-full border border-[#2A2F45] shadow-lg hover:border-[#3b4059] transition-all duration-200 group relative">
      {/* --- Card Header --- */}
      <div className="drag-handle flex items-start justify-between mb-2 cursor-move select-none">
        <div className="flex items-center gap-2 text-gray-400">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onExpand}
            className="hover:text-white transition-colors cursor-pointer"
            title="Expand"
          >
            <MdDragIndicator size={20} />
          </button>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-300">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 text-gray-400">
          {infoText && (
            <>
              <button
                ref={infoBtnRef}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
                className="ml-1 text-gray-400 hover:text-white flex items-center"
              >
                <FiInfo size={14} />
              </button>

              {showInfo &&
                ReactDOM.createPortal(
                  <div
                    style={{
                      position: "absolute",
                      top: tooltipPos.top,
                      left: tooltipPos.left,
                      zIndex: 9999,
                    }}
                    className="w-72 bg-[#111827] text-xs text-gray-100 p-3 rounded-md shadow-xl border border-[#374151]"
                    onMouseEnter={() => setShowInfo(true)}
                    onMouseLeave={() => setShowInfo(false)}
                  >
                    {infoText}
                  </div>,
                  document.body,
                )}
            </>
          )}

          {/* EMBEDDED FILTER DROPDOWN */}
          <div
            className="relative"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <FilterDropdown {...filterProps} isMinimal={true} />
          </div>

          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onRemove}
            className="hover:text-red-400 transition-colors cursor-pointer ml-1"
            title="Remove"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>

      {/* --- Main Value --- */}
      <div className="mt-0 pointer-events-none flex-grow flex items-center">
        <h3
          className={`${
            isLongText ? "text-[13px] leading-snug uppercase" : "text-[32px]"
          } font-bold text-white tracking-tight`}
        >
          {value}
        </h3>
      </div>

      {/* --- Sub Text --- */}
      <div
        className={`text-[11px] mt-2 flex items-center gap-2 font-medium pointer-events-none ${
          subClass || "text-gray-500"
        }`}
      >
        {subIcon && (
          <span className="flex items-center justify-center">{subIcon}</span>
        )}
        {subText}
      </div>
    </div>
  );
};

export default KpiWidget;

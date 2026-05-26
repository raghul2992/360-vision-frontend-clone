import React from "react";
import FilterDropdown from "../../../component/FilterDropdown";
import { useState, useRef, useEffect } from "react";
import { bgcolors, textcolors, borderstyles, colors } from "../../../theme";
import ReactDOM from "react-dom";
import { CloseIcon, InfoIcon, MoveIcon } from "../../../icons";
const KpiWidget = ({
  title,
  value,
  subText,
  subIcon,
  infoText,
  subClass,
  accentColor,
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
    left = Math.max(window.scrollX + 8, left);
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
    <div className={`${bgcolors.white} rounded-2xl flex flex-col justify-between h-full ${borderstyles.light} shadow-sm hover:shadow-md ${borderstyles.hoverGray} transition-all duration-200 group relative overflow-hidden`}>
      <span
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-full"
        style={{ height: '80%', backgroundColor: accentColor || colors.primary }}
      />
      <div className="p-4 flex flex-col justify-between h-full">
      {/* --- Card Header --- */}
      <div className="drag-handle flex items-start justify-between mb-2 cursor-move select-none">
        <div className={`flex items-center gap-2 ${textcolors.muted}`}>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onExpand}
            className={`${textcolors.hoverMuted} transition-colors cursor-pointer`}
            title="Expand"
          >
            <MoveIcon size={20} />
          </button>
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${textcolors.dim}`}>
            {title}
          </span>
        </div>

        <div className={`flex items-center gap-2 ${textcolors.muted}`}>
          {infoText && (
            <>
              <button
                ref={infoBtnRef}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
                className={`ml-1 ${textcolors.muted} ${textcolors.hoverMuted} flex items-center`}
              >
                <InfoIcon size={14} />
              </button>

              {showInfo &&
                ReactDOM.createPortal(
                  <div
                    style={{
                      position: "absolute",
                      top: tooltipPos.top,
                      left: tooltipPos.left,
                      zIndex: 9999,
                      color: colors.text,
                    }}
                    className={`w-72 ${bgcolors.white} text-xs p-3 rounded-md shadow-xl ${borderstyles.light}`}
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
            className={`${textcolors.hoverDanger} transition-colors cursor-pointer ml-1 ${textcolors.muted}`}
            title="Remove"
          >
            <CloseIcon size={16} />
          </button>
        </div>
      </div>

      {/* --- Main Value --- */}
      <div className="mt-0 pointer-events-none flex-grow flex items-center">
        <h3
          className={`${
            isLongText ? "text-[13px] leading-snug uppercase" : "text-[32px]"
          } font-bold tracking-tight`}
          style={{ color: colors.text }}
        >
          {value}
        </h3>
      </div>

      {/* --- Sub Text --- */}
      <div
        className={`text-[11px] mt-2 flex items-center gap-2 font-medium pointer-events-none ${
          subClass || textcolors.dim
        }`}
      >
        {subIcon && (
          <span className="flex items-center justify-center">{subIcon}</span>
        )}
        {subText}
      </div>
      </div>
    </div>
  );
};

export default KpiWidget;

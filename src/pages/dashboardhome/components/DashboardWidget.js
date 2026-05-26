import React, { useState, useRef, useEffect } from 'react'
import FilterDropdown from '../../../component/FilterDropdown'
import ReactDOM from 'react-dom'
import { bgcolors, textcolors, borderstyles, colors } from '../../../theme'
import { MoveIcon, CloseIcon, InfoIcon } from '../../../icons'

const DashboardWidget = ({
  title,
  widgetName,
  onRemove,
  filterProps,
  footerText,
  infoText,
  children,
  className = '',
  // Pass through props for Grid Layout to function correctly
  style,
  onMouseDown,
  onMouseUp,
  onTouchEnd,
  ...props
}) => {
  const [showInfo, setShowInfo] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const infoBtnRef = useRef(null)

  const updateTooltipPosition = () => {
    if (!infoBtnRef.current) return
    const rect = infoBtnRef.current.getBoundingClientRect()
    const tooltipWidth = 280
    let top = rect.top + window.scrollY
    let left = rect.right + window.scrollX + 8
    if (left + tooltipWidth > window.scrollX + window.innerWidth - 8) {
      left = rect.left + window.scrollX - tooltipWidth - 8
    }
    left = Math.max(window.scrollX + 8, left)
    setTooltipPos({ top, left })
  }

  useEffect(() => {
    if (!showInfo) return
    updateTooltipPosition()
    window.addEventListener('scroll', updateTooltipPosition, true)
    window.addEventListener('resize', updateTooltipPosition)
    return () => {
      window.removeEventListener('scroll', updateTooltipPosition, true)
      window.removeEventListener('resize', updateTooltipPosition)
    }
  }, [showInfo])

  return (
    <div
      style={style}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchEnd={onTouchEnd}
      className={`${bgcolors.white} rounded-2xl shadow-sm ${borderstyles.light} hover:shadow-md ${borderstyles.hoverGray} transition-all duration-200 h-full flex flex-col ${className}`}
      {...props}
    >
      {/* Header - Fixed */}
      <div className='flex justify-between items-start p-4 border-b flex-shrink-0' style={{ borderColor: colors.border }}>
        <div className='flex items-center space-x-3 flex-grow min-w-0'>
          <div className={`drag-handle cursor-move ${textcolors.muted} ${textcolors.hoverMuted} transition-colors`}>
            <MoveIcon size={20} />
          </div>
          <div className='flex-grow min-w-0'>
            <h3 className='text-md font-semibold truncate' style={{ color: colors.text }}>
              {title}
            </h3>
          </div>
        </div>
        <div className='relative z-50 no-drag flex items-center flex-shrink-0 space-x-2'>
          {infoText && (
            <>
              <button
                ref={infoBtnRef}
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
                className={`${textcolors.muted} ${textcolors.hoverMuted} flex items-center`}
              >
                <InfoIcon size={16} />
              </button>
              {showInfo &&
                ReactDOM.createPortal(
                  <div
                    style={{
                      position: 'absolute',
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
                  document.body
                )}
            </>
          )}
          {filterProps && <FilterDropdown {...filterProps} />}
          <button
            onClick={() => onRemove(widgetName)}
            className={`${textcolors.muted} ${textcolors.hoverDanger} transition-colors p-1 rounded-full ${bgcolors.dangerHover}`}
            title='Remove Widget'
          >
            <CloseIcon size={18} />
          </button>
        </div>
      </div>

      {/* Body - Scrollable */}
      <div className='flex-1 overflow-auto scrollbar-thin mt-5 p-4'>
        <div className='h-full flex flex-col items-center justify-center min-h-0'>
          {children}
        </div>
      </div>

      {/* Footer - Fixed */}
      {footerText && (
        <div className={`flex justify-center items-center p-3 border-t ${bgcolors.grayFaint} rounded-b-2xl flex-shrink-0`} style={{ borderColor: colors.border }}>
          <div className={`text-xs ${textcolors.dim}`}>{footerText}</div>
        </div>
      )}
    </div>
  )
}

export default DashboardWidget

import React, { useState, useRef, useEffect } from 'react'
import { FiMove, FiX, FiInfo } from 'react-icons/fi'
import FilterDropdown from '../../../component/FilterDropdown'
import ReactDOM from 'react-dom'

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
      className={`bg-[#2a2f45] rounded-xl shadow-sm border border-[#2a2f45] hover:border-[#3B3F58] transition-colors h-full flex flex-col ${className}`}
      {...props}
    >
      {/* Header - Fixed */}
      <div className='flex justify-between items-start p-4 border-b border-[#3B3F58] flex-shrink-0'>
        <div className='flex items-center space-x-3 flex-grow min-w-0'>
          <div className='drag-handle cursor-move text-gray-400 hover:text-white transition-colors'>
            <FiMove size={20} />
          </div>
          <div className='flex-grow min-w-0'>
            <h3 className='text-md font-semibold text-white truncate'>
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
                className='text-gray-400 hover:text-white flex items-center'
              >
                <FiInfo size={16} />
              </button>
              {showInfo &&
                ReactDOM.createPortal(
                  <div
                    style={{
                      position: 'absolute',
                      top: tooltipPos.top,
                      left: tooltipPos.left,
                      zIndex: 9999
                    }}
                    className='w-72 bg-[#111827] text-xs text-gray-100 p-3 rounded-md shadow-xl border border-[#374151]'
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
            className='text-gray-500 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-700'
            title='Remove Widget'
          >
            <FiX size={18} />
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
        <div className='flex justify-center items-center p-3 border-t border-[#3B3F58] bg-[#1f2435] rounded-b-xl flex-shrink-0'>
          <div className='text-xs text-gray-400'>{footerText}</div>
        </div>
      )}
    </div>
  )
}

export default DashboardWidget

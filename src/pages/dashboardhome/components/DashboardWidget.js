import React from 'react'
import { FiMove, FiX } from 'react-icons/fi'
import FilterDropdown from '../../../component/FilterDropdown'

const DashboardWidget = ({
  title,
  widgetName,
  onRemove,
  filterProps,
  footerText,
  children,
  className = '',
  // Pass through props for Grid Layout to function correctly
  style,
  onMouseDown,
  onMouseUp,
  onTouchEnd,
  ...props
}) => {
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

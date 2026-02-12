import React from 'react'
import { FiX, FiMaximize2 ,FiMove} from 'react-icons/fi'
import FilterDropdown from '../../../component/FilterDropdown' // Adjust path if needed

const KpiWidget = ({
  title,
  value,
  subText,
  subIcon,
  subClass,
  onExpand,
  onRemove,
  filterProps // Receives all filter props specifically for this card
}) => {
  const isLongText = typeof value === 'string' && value.length > 8

  return (
    <div className='bg-[#2a2f45] rounded-lg p-4 flex flex-col justify-between h-full border border-[#2A2F45] shadow-lg hover:border-[#3b4059] transition-all duration-200 group relative'>
      {/* --- Card Header --- */}
      <div className='drag-handle flex items-start justify-between mb-2 cursor-move select-none'>
        <div className='flex items-center gap-2 text-gray-400'>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={onExpand}
            className='hover:text-white transition-colors cursor-pointer'
            title='Expand'
          >
            <FiMove size={14} />
          </button>
          <span className='text-[11px] font-semibold uppercase tracking-wider text-gray-300'>
            {title}
          </span>
        </div>

        <div className='flex items-center gap-2 text-gray-400'>
          {/* EMBEDDED FILTER DROPDOWN */}
          <div
            className='relative'
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
          >
            <FilterDropdown {...filterProps} isMinimal={true} />
          </div>

          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={onRemove}
            className='hover:text-red-400 transition-colors cursor-pointer ml-1'
            title='Remove'
          >
            <FiX size={16} />
          </button>
        </div>
      </div>

      {/* --- Main Value --- */}
      <div className='mt-0 pointer-events-none flex-grow flex items-center'>
        <h3
          className={`${
            isLongText ? 'text-[13px] leading-snug uppercase' : 'text-[32px]'
          } font-bold text-white tracking-tight`}
        >
          {value}
        </h3>
      </div>

      {/* --- Sub Text --- */}
      <div
        className={`text-[11px] mt-2 flex items-center gap-2 font-medium pointer-events-none ${
          subClass || 'text-gray-500'
        }`}
      >
        {subIcon && (
          <span className='flex items-center justify-center'>{subIcon}</span>
        )}
        {subText}
      </div>
    </div>
  )
}

export default KpiWidget

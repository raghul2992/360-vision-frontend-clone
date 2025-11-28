// ChartWidget.jsx
import React from 'react'

const ChartWidget = ({ children, filterContent, isResizable = true }) => {
  return (
    <div
      className={`bg-[#2a2f45] rounded-lg p-4 h-full flex flex-col ${
        isResizable ? 'react-grid-item-content' : ''
      }`}
    >
      {/* Header */}
      <div className='flex justify-between items-center mb-4'>
        {filterContent && <div className='flex gap-2'>{filterContent}</div>}
      </div>

      {/* Chart Container - Make it responsive */}
      <div className='flex-1 min-h-0 w-full'>
        <div className='h-full w-full relative'>
          {React.Children.map(children, child =>
            React.isValidElement(child)
              ? React.cloneElement(child, {
                  responsive: true,
                  className: 'w-full h-full'
                })
              : child
          )}
        </div>
      </div>
    </div>
  )
}

export default ChartWidget

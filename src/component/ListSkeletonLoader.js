import React from 'react'

const ListSkeletonLoader = ({ rows = 5, height = 'h-10' }) => {
  return (
    <div className='p-2 space-y-3 animate-pulse'>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className='flex items-center space-x-4'>
          <div className={`flex-1 ${height} bg-[#1f2435] rounded`} />
          <div className='w-1/4 h-6 bg-[#1f2435] rounded' />
        </div>
      ))}
    </div>
  )
}

export default ListSkeletonLoader

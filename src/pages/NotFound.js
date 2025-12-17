import React from 'react'
import { useNavigate } from 'react-router-dom'

function NotFound () {
  const navigate = useNavigate()

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <h1 className='text-6xl font-bold text-gray-800 mb-4'>404</h1>
        <p className='text-xl text-gray-600 mb-8'>Page not found</p>
        <button
          onClick={() => navigate('/')}
          className='font-semibold text-white text-base bg-[#3885CC] w-full py-[8px] px-[16px]  flex items-center justify-center rounded-[100px]'
        >
          Go Home
        </button>
      </div>
    </div>
  )
}

export default NotFound

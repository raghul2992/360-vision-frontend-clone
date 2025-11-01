import React from 'react'
import { useDispatch } from 'react-redux'
import { updateAlertStatus } from '../../features/alert/alertsslice'

const AlertItem = ({ alert }) => {
  const dispatch = useDispatch()

  const handleStatusChange = (id, status) => {
    dispatch(updateAlertStatus({ id, status }))
  }
  const getStatusColor = status => {
    if (status === 'confirmed') return 'bg-red-500'
    if (status === 'resolved') return 'bg-green-500'
    return 'bg-yellow-500' // Default for 'active' or other statuses
  }

  const getIconColor = status => {
    if (status === 'confirmed') return 'bg-red-100'
    if (status === 'resolved') return 'bg-green-100'
    return 'bg-yellow-100'
  }

  const getIconBorderColor = status => {
    if (status === 'confirmed') return 'border-red-300'
    if (status === 'resolved') return 'border-green-300'
    return 'border-yellow-300'
  }

  return (
    <div className='bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-lg transition-shadow'>
      <div className='flex items-center gap-4 flex-1'>
        <div
          className={`w-12 h-12 rounded-full ${getIconColor(
            alert.status
          )} border-2 ${getIconBorderColor(
            alert.status
          )} flex items-center justify-center`}
        >
          <svg
            className={`w-6 h-6 ${
              alert.status === 'confirmed'
                ? 'text-red-500'
                : alert.status === 'resolved'
                ? 'text-green-500'
                : 'text-yellow-500'
            }`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
            />
          </svg>
        </div>

        <div className='flex-1'>
          <p className='text-gray-800 text-sm font-medium mb-1'>
            {alert.camera}
          </p>
          <p className='text-gray-600 text-sm'>
            {alert.type} - {alert.date}
          </p>
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <div className='flex items-center gap-3'>
          {alert.status !== 'confirmed' && (
            <button
              onClick={() => handleStatusChange(alert.id, 'confirmed')}
              className='p-2 hover:bg-gray-100 rounded-full transition-colors'
            >
              <span className='text-gray-600 font-semibold text-sm'>
                Confirmar
              </span>
            </button>
          )}
          {alert.status !== 'resolved' && (
            <button
              onClick={() => handleStatusChange(alert.id, 'resolved')}
              className='p-2 hover:bg-gray-100 rounded-full transition-colors'
            >
              <span className='text-gray-600 font-semibold text-sm'>
                Resolver
              </span>
            </button>
          )}
        </div>
        <button className='p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors'>
          <svg
            className='w-5 h-5 text-gray-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
            />
          </svg>
        </button>

        <div
          className={`w-3 h-3 rounded-full ${getStatusColor(alert.status)}`}
        ></div>

        <button className='p-2 hover:bg-gray-100 rounded transition-colors'>
          <svg
            className='w-5 h-5 text-gray-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z'
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default AlertItem

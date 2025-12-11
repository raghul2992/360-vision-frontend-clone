import React from 'react'
import ButtonComponent from './Button'
import { IoAlertCircleOutline, IoCloseOutline } from 'react-icons/io5'

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete'
}) => {
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4'>
      <div className='bg-[#1c1c24] rounded-xl shadow-2xl w-full max-w-sm'>
        <div className='p-6'>
          <div className='flex justify-between items-start mb-4'>
            <div className='flex items-center'>
              <IoAlertCircleOutline className='text-red-500 mr-3' size={24} />
              <h2 className='text-xl font-bold text-white'>{title}</h2>
            </div>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-white'
            >
              <IoCloseOutline size={24} />
            </button>
          </div>

          <p className='text-gray-300 mb-6'>{message}</p>

          <div className='flex justify-end space-x-4'>
            <ButtonComponent
              onClick={onClose}
              className='px-4 py-2 text-sm rounded-lg border border-gray-600/50 text-gray-300 hover:bg-[#2a2a35] transition-colors'
            >
              Cancel
            </ButtonComponent>
            <ButtonComponent
              onClick={onConfirm}
              className='px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors'
            >
              {confirmText}
            </ButtonComponent>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal

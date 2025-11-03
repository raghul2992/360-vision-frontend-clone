// components/Navbar.js
import React, { useState, useEffect } from 'react'
import { IoGlobeOutline } from 'react-icons/io5'
import { useTranslation } from 'react-i18next'
import { bgcolors } from '../theme'
import NotificationBell from './NotificationBell'
import useWebSocket from '../hooks/useWebSocket'
import { useSelector } from 'react-redux'

const Navbar = () => {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [wsStatus, setWsStatus] = useState('disconnected') // Track status locally

  const tenantId = localStorage.getItem('tenant_id')
  const wsUrl = tenantId
    ? `${process.env.REACT_APP_BASE_URL}/ws/${tenantId}`
    : null

  const { isConnected, error } = useWebSocket(wsUrl)

  // Update local state whenever isConnected changes
  useEffect(() => {
    setWsStatus(isConnected ? 'connected' : 'disconnected')
    console.log(
      'WebSocket status updated:',
      isConnected ? 'connected' : 'disconnected'
    )
  }, [isConnected])

  const changeLanguage = lng => {
    i18n.changeLanguage(lng)
    setIsOpen(false)
  }

  return (
    <div
      className={`${bgcolors.dark} text-white h-16 flex items-center justify-end px-4`}
    >
      <div className='flex items-center gap-6'>
        {/* WebSocket Connection Indicator */}
        <div className='flex items-center gap-2'>
          <div
            className={`w-3 h-3 rounded-full transition-colors ${
              wsStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`}
            title={
              wsStatus === 'connected'
                ? 'WebSocket Connected'
                : `WebSocket Disconnected ${error ? `- ${error}` : ''}`
            }
          ></div>
          <span className='text-xs text-gray-400'>
            {wsStatus === 'connected' ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Language Selector */}
        <div className='relative'>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className='flex items-center gap-2 p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors'
          >
            <IoGlobeOutline size={20} className='text-white' />
            <span className='text-sm font-medium'>
              {i18n.language.toUpperCase()}
            </span>
          </button>

          {isOpen && (
            <div className='absolute top-12 right-0 bg-gray-800 border border-gray-700 rounded-md shadow-lg w-36 text-white z-50'>
              <button
                onClick={() => changeLanguage('en')}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  i18n.language === 'en'
                    ? 'bg-gray-700 font-semibold'
                    : 'hover:bg-gray-700'
                }`}
              >
                English
              </button>
              <button
                onClick={() => changeLanguage('pt')}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  i18n.language === 'pt'
                    ? 'bg-gray-700 font-semibold'
                    : 'hover:bg-gray-700'
                }`}
              >
                Português
              </button>
            </div>
          )}
        </div>

        {/* Notification Bell Component */}
        <NotificationBell />
      </div>
    </div>
  )
}

export default Navbar

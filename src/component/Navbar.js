import React, { useState } from 'react'
import { IoNotificationsOutline, IoGlobeOutline } from 'react-icons/io5'
import { useTranslation } from 'react-i18next'
import { bgcolors } from '../theme'

const Navbar = () => {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const changeLanguage = lng => {
    i18n.changeLanguage(lng)
    setIsOpen(false)
  }

  return (
    <div
      className={`${bgcolors.dark} text-white h-16 flex items-center justify-end px-4`}
    >
      <div className='flex items-center gap-6'>
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
            <div className="absolute top-12 right-0 bg-gray-800 border border-gray-700 rounded-md shadow-lg w-36 text-white">
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

        {/* Notification Icon */}
        <div className='relative'>
          <div className='p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors'>
            <IoNotificationsOutline size={20} />
          </div>
          <span className='absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-blue-500'></span>
        </div>
      </div>
    </div>
  )
}

export default Navbar

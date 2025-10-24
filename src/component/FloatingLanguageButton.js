import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IoGlobeOutline } from 'react-icons/io5'

const FloatingLanguageButton = () => {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const changeLanguage = lng => {
    i18n.changeLanguage(lng)
    localStorage.setItem('i18nextLng', lng)
    setIsOpen(false)
  }

  const languageNames = {
    en: 'English',
    pt: 'Português'
  }

  const currentLang = languageNames[i18n.language] || 'Language'

  return (
    <div className='fixed bottom-5 right-5 z-50'>
      <div className='relative group'>
        {/* Floating Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className='bg-blue-500 text-white rounded-full p-3 shadow-lg hover:bg-blue-600 transition-colors flex items-center gap-2 overflow-hidden'
        >
          <IoGlobeOutline size={22} />

          {/* Initially show code, expand to full name on hover */}
          <span className='inline-block text-sm font-medium transition-all duration-300 ease-in-out'>
            <span className='group-hover:hidden'>
              {i18n.language.toUpperCase()}
            </span>
            <span className='hidden group-hover:inline'>{currentLang}</span>
          </span>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className='absolute bottom-16 right-0 bg-white rounded-md shadow-lg w-36'>
            <button
              onClick={() => changeLanguage('en')}
              className={`block w-full text-left px-4 py-2 text-sm ${
                i18n.language === 'en'
                  ? 'bg-gray-100 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              English
            </button>
            <button
              onClick={() => changeLanguage('pt')}
              className={`block w-full text-left px-4 py-2 text-sm ${
                i18n.language === 'pt'
                  ? 'bg-gray-100 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Português
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FloatingLanguageButton

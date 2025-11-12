import React from 'react'
import { useTranslation } from 'react-i18next'
import { IoClose } from 'react-icons/io5'
import { FaWhatsapp, FaPhoneAlt, FaEnvelope } from 'react-icons/fa'

const CallPopup = ({ recipients, onClose }) => {
  const { t } = useTranslation()
  console.log('Recipients:', recipients)

  // ✅ Format all types of recipients
  const formattedRecipients = [
    ...(recipients?.whatsapp?.recipients?.map(num => ({
      type: 'whatsapp',
      contact: num
    })) || []),
    ...(recipients?.call?.recipients?.map(num => ({
      type: 'call',
      contact: num
    })) || []),
    ...(recipients?.email?.recipients?.map(email => ({
      type: 'email',
      contact: email
    })) || [])
  ]

  // ✅ Icon for each type
  const getIcon = type => {
    switch (type) {
      case 'whatsapp':
        return (
          <div className='w-7 h-7 bg-green-600 rounded-full flex items-center justify-center'>
            <FaWhatsapp className='text-white text-sm' />
          </div>
        )
      case 'call':
        return (
          <div className='w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center'>
            <FaPhoneAlt className='text-white text-xs' />
          </div>
        )
      case 'email':
        return (
          <div className='w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center'>
            <FaEnvelope className='text-white text-xs' />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className='fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50'>
      <div className='bg-white w-[380px] max-h-[50vh] rounded-2xl shadow-xl overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between px-5 py-3 border-b'>
          <h2 className='text-base font-semibold text-gray-800'>
            {t('call_popup.title') || 'Notification Contacts'}
          </h2>
          <button
            onClick={onClose}
            className='text-gray-500 hover:text-gray-700 transition'
          >
            <IoClose size={22} />
          </button>
        </div>

        {/* Table Header */}
        <div className='bg-gray-100 px-5 py-2 border-b text-sm font-medium text-gray-600'>
          {t('call_popup.contact_info') || 'Contact Info'}
        </div>

        {/* Contact List */}
        <div className='overflow-y-auto custom-scrollbar'>
          {formattedRecipients.length > 0 ? (
            formattedRecipients.map((item, index) => (
              <div
                key={index}
                className='flex items-center gap-3 px-5 py-2 border-b hover:bg-gray-50 transition'
              >
                {getIcon(item.type)}
                <div className='text-gray-700 font-medium text-sm break-words'>
                  {item.contact}
                </div>
              </div>
            ))
          ) : (
            <div className='px-6 py-6 text-gray-500 text-center text-sm'>
              {t('call_popup.no_recipients') ||
                'Nenhum destinatário configurado.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CallPopup

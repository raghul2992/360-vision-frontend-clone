import React from 'react'
import { useTranslation } from 'react-i18next'

const AlertDetails = () => {
  const { t } = useTranslation()
  return (
    <div className='bg-[#1e212e] text-white p-6 rounded-lg'>
      <div className='flex'>
        <div className='w-2/3 pr-6'>
          <img
            src='https://via.placeholder.com/600x400' // Placeholder for the alert image
            alt={t('alerts.alert_image_alt')}
            className='rounded-lg'
          />
        </div>
        <div className='w-1/3'>
          <h2 className='text-xl font-bold mb-4'>{t('alerts.information')}:</h2>
          <div className='space-y-2 text-gray-300'>
            <p>
              <strong>{t('alerts.unit')}:</strong> Posto BR - Faria Lima
            </p>
            <p>
              <strong>{t('alerts.camera')}:</strong> Pista 1
            </p>
            <p>
              <strong>{t('alerts.time')}:</strong> 14:33
            </p>
            <p>
              <strong>{t('alerts.confidence')}:</strong> 93%
            </p>
          </div>
        </div>
      </div>
      <div className='mt-6'>
        <div className='flex justify-between items-center mb-2'>
          <h3 className='text-lg font-bold'>{t('alerts.comments')}:</h3>
          <button className='text-gray-400 hover:text-white'>
            <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z' />
              <path
                fillRule='evenodd'
                d='M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z'
                clipRule='evenodd'
              />
            </svg>
          </button>
        </div>
        <p className='text-gray-400'>{t('alerts.alert_description')}</p>
      </div>
    </div>
  )
}

export default AlertDetails

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { IoGrid, IoList, IoApps, IoAddCircleOutline } from 'react-icons/io5'
import { bgcolors } from '../../theme'
import CameraGrid from './CameraGrid'
import CameraList from './CameraList'

const CameraPage = () => {
  const { t } = useTranslation()
  const [view, setView] = useState('grid')

  return (
    <div className={`p-8 ${bgcolors.dark} text-white min-h-screen`}>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>{t('cameraGrid.title')}</h1>
          <p className='text-gray-400 mt-1'>{t('cameraGrid.description')}</p>
        </div>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-1 bg-[#30313F] p-1 rounded-lg'>
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-md transition-colors ${
                view === 'grid' ? 'bg-[#555863]' : ''
              }`}
            >
              <IoApps size={20} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-md transition-colors ${
                view === 'list' ? 'bg-[#555863]' : ''
              }`}
            >
              <IoList size={20} />
            </button>
          </div>
          <Link to='/add-camera'>
            <button className='flex items-center gap-2 bg-[#3885CC] text-white font-semibold py-2.5 px-5 rounded-full transition-colors'>
              <IoAddCircleOutline size={22} className='font-semibold' />
              {t('cameraGrid.addCameraButton')}
            </button>
          </Link>
        </div>
      </div>
      {view === 'grid' ? <CameraGrid /> : <CameraList />}
    </div>
  )
}

export default CameraPage

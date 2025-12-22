import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  IoGrid,
  IoList,
  IoApps,
  IoAddCircleOutline,
  IoChevronDown
} from 'react-icons/io5'
import { bgcolors } from '../../theme'
import CameraGrid from './CameraGrid'
import CameraList from './CameraList'
import { useDispatch, useSelector } from 'react-redux'
import { getLocations } from '../../features/locations/locationApiSlice'

const CameraPage = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  // ✅ Default view set to 'list'
  const [view, setView] = useState('list')
  const [selectedLocation, setSelectedLocation] = useState('')

  const { locations, isLoading: locationsLoading } = useSelector(
    state => state.locationApi
  )
  const tenantId = localStorage.getItem('tenant_id')

  useEffect(() => {
    if (tenantId) {
      dispatch(getLocations({ tenantId }))
    }
  }, [dispatch, tenantId])

  return (
    <div className={`p-8 ${bgcolors.dark} text-white min-h-screen`}>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>{t('cameraGrid.title')}</h1>
          <p className='text-gray-400 mt-1'>{t('cameraGrid.description')}</p>
        </div>
        <div className='flex items-center gap-4'>
          {/* <div className='relative'>
            <select
              className='w-full bg-[#3A3B47] border border-gray-600/50 rounded-lg py-2.5 px-4 pr-10 text-white focus:outline-none focus:border-gray-500 text-sm appearance-none cursor-pointer'
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              disabled={locationsLoading}
            >
              <option value=''>All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name || loc.location_name}
                </option>
              ))}
            </select>
            <IoChevronDown
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
              size={16}
            />
          </div> */}
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
      {view === 'grid' ? (
        <CameraGrid locationId={selectedLocation} />
      ) : (
        <CameraList locationId={selectedLocation} />
      )}
    </div>
  )
}

export default CameraPage

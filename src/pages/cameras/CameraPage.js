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
    <div className={`${bgcolors.white}  p-8 min-h-screen`}>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>{t('cameraGrid.title')}</h1>
          <p className='mt-1'>{t('cameraGrid.description')}</p>
        </div>
        <div className='flex items-center gap-4'>
          <Link to='/add-camera'>
            <button className='flex items-center gap-2 bg-[#3885CC] text-white font-semibold py-2.5 px-5 rounded-full transition-colors'>
              <IoAddCircleOutline size={22} className='font-semibold' />
              {t('cameraGrid.addCameraButton')}
            </button>
          </Link>
        </div>
      </div>
      <CameraList locationId={selectedLocation} />
    </div>
  )
}

export default CameraPage

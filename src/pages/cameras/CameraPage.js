import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PlusCircleIcon } from '../../icons'
import { bgcolors, textcolors, textSizes, buttons } from '../../theme'
import CameraList from './CameraList'
import { useDispatch, useSelector } from 'react-redux'
import { getLocations } from '../../features/locations/locationApiSlice'

const CameraPage = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [selectedLocation, setSelectedLocation] = useState('')
  const { locations } = useSelector(state => state.locationApi)
  const tenantId = localStorage.getItem('tenant_id')

  useEffect(() => {
    if (tenantId) dispatch(getLocations({ tenantId }))
  }, [dispatch, tenantId])

  return (
    <div className={`${bgcolors.surface} p-4 sm:p-6 lg:p-8 min-h-screen`}>
      <div className='flex flex-wrap justify-between items-start gap-3 mb-6'>
        <div>
          <h1 className={`text-3xl font-bold ${textcolors.dark}`}>
            {t('cameraGrid.title')}
          </h1>
          <p className={`mt-1 ${textcolors.dim} ${textSizes.subtitle}`}>
            {t('cameraGrid.description')}
          </p>
        </div>
        <Link to='/add-camera'>
          <button className={`${buttons.primary} flex items-center gap-2 py-2.5 px-5 rounded-full shrink-0`}>
            <PlusCircleIcon size={22} />
            {t('cameraGrid.addCameraButton')}
          </button>
        </Link>
      </div>
      <CameraList locationId={selectedLocation} />
    </div>
  )
}

export default CameraPage

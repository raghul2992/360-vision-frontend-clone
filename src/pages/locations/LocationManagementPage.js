import React, { useState } from 'react'
import { useLoadScript } from '@react-google-maps/api'
import { useTranslation } from 'react-i18next'
import LocationList from '../../component/LocationList'
import LocationMap from '../../component/LocationMap'
import LocationFormModal from '../../component/LocationFormModal'
import { IoAddCircleOutline } from 'react-icons/io5'
import { bgcolors } from '../../theme'

const libraries = ['places']

const LocationManagementPage = () => {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 1. Get the role and determine permissions
  const userRole = localStorage.getItem('user_role')
  const isViewer = userRole === 'viewer'

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  })

  if (loadError)
    return (
      <div className='text-red-500 p-6'>
        {t('location.map.error')}: {loadError.message}
      </div>
    )

  if (!isLoaded)
    return (
      <div className='text-gray-400 w-full h-screen flex items-start justify-center pt-20'>
        {t('location.loading')}
      </div>
    )

  return (
    <div className={`${bgcolors.white} p-8 min-h-screen`}>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>
            {t('location.management.title', 'Location Management')}
          </h1>
          <p className='mt-1'>
            {t(
              'location.management.description',
              'Manage all physical locations.'
            )}
          </p>
        </div>

        {/* 2. Conditionally render the Add Button */}
        {!isViewer && (
          <div className='flex items-center gap-4'>
            <button
              onClick={() => setIsModalOpen(true)}
              className='flex items-center gap-2 bg-[#3885CC] text-white font-semibold py-2.5 px-5 rounded-full transition-colors hover:bg-[#2b6cb0]'
            >
              <IoAddCircleOutline size={22} className='font-semibold' />
              {t('location.management.addLocationButton', 'Add Location')}
            </button>
          </div>
        )}
      </div>

      <div className='grid grid-cols-1 gap-6'>
        {/* Map View Section */}
        <div className='bg-[#1c1c24] p-4 rounded-lg shadow-md'>
          <h2 className='text-xl font-semibold mb-3 text-white'>
            {t('location.map.title', 'Location Overview Map')}
          </h2>
          {/* 3. Pass readOnly prop to Map */}
          <LocationMap isLoaded={isLoaded} readOnly={isViewer} />
        </div>

        {/* List View Section */}
        <div className='bg-[#1c1c24] p-4 rounded-lg shadow-md'>
          {/* 4. Pass readOnly prop to List */}
          <LocationList isMapLoaded={isLoaded} readOnly={isViewer} />
        </div>
      </div>

      {/* Prevent modal from rendering/opening if viewer, for extra security */}
      {!isViewer && (
        <LocationFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          locationToEdit={null}
          isLoaded={isLoaded}
        />
      )}
    </div>
  )
}

export default LocationManagementPage

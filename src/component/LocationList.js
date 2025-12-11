import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import {
  getLocations,
  deleteLocation,
  updateLocation
} from '../features/locations/locationApiSlice'
import ButtonComponent from './Button'
import LocationFormModal from './LocationFormModal'
import ConfirmationModal from './ConfirmationModal'
import {
  IoTrashOutline,
  IoPencilOutline,
  IoAddCircleOutline
} from 'react-icons/io5'

const LocationList = ({ isMapLoaded }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { locations, isLoading } = useSelector(state => state.locationApi)
  const tenantId = localStorage.getItem('tenant_id')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [locationToEdit, setLocationToEdit] = useState(null)
  const [locationToDelete, setLocationToDelete] = useState(null)

  // Fetch locations
  useEffect(() => {
    dispatch(getLocations({ tenantId }))
  }, [dispatch, tenantId])

  const handleOpenCreate = () => {
    setLocationToEdit(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = location => {
    setLocationToEdit(location)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setLocationToEdit(null)
  }

  const handleOpenConfirm = location => {
    setLocationToDelete(location)
    setIsConfirmOpen(true)
  }

  const handleCloseConfirm = () => {
    setIsConfirmOpen(false)
    setLocationToDelete(null)
  }

  const handleConfirmDelete = () => {
    if (tenantId && locationToDelete) {
      dispatch(deleteLocation({ tenantId, locationId: locationToDelete.id }))
      handleCloseConfirm()
    }
  }

  const handleStatusChange = async (location, newStatus) => {
    try {
      await dispatch(
        updateLocation({
          tenantId,
          locationId: location.id,
          locationData: { status: newStatus }
        })
      ).unwrap()

      toast.success(t('location.update.success'))
      dispatch(getLocations(tenantId))
    } catch (error) {
      toast.error(t('location.update.statusUpdateFailed'))
    }
  }

  const LocationRow = ({ location }) => (
    <tr className='border-b border-gray-700/30 hover:bg-[#32333F] transition-colors'>
      <td className='py-3 px-4 text-white text-sm font-medium'>
        {location.name}
      </td>

      <td className='py-3 px-4 text-gray-300 text-xs font-semibold'>
        <span
          className={`px-2 py-1 rounded-md text-xs font-semibold ${
            location.status === 'active'
              ? 'bg-green-900/40 text-green-300 border border-green-700/50'
              : 'bg-red-900/40 text-red-300 border border-red-700/50'
          }`}
        >
          {location.status.charAt(0).toUpperCase() + location.status.slice(1)}
        </span>
      </td>

      <td className='py-3 px-4 text-sm'>
        <div className='flex justify-between items-center w-20'>
          <button
            onClick={() => handleOpenEdit(location)}
            className='p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-md transition'
          >
            <IoPencilOutline size={18} />
          </button>

          <button
            onClick={() => handleOpenConfirm(location)}
            className='p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition'
          >
            <IoTrashOutline size={18} />
          </button>
        </div>
      </td>
    </tr>
  )

  return (
    <div className='relative'>
      <div className='flex justify-between mb-4 items-center'>
        <h2 className='text-xl font-semibold text-white'>
          {t('location.list.title')}
        </h2>

        <ButtonComponent
          onClick={handleOpenCreate}
          className='flex items-center bg-[#3885CC] hover:bg-[#2A6DA8] text-white 
                    py-2.5 px-4 rounded-full font-semibold shadow-md'
        >
          <IoAddCircleOutline size={20} className='mr-2' />
          {t('location.management.addLocationButton')}
        </ButtonComponent>
      </div>

      <div className='overflow-x-auto rounded-lg shadow-lg'>
        <table className='min-w-full table-auto bg-[#262732] rounded-xl overflow-hidden'>
          <thead>
            <tr className='bg-[#343544] text-left text-xs font-semibold uppercase text-gray-300 tracking-wider'>
              <th className='py-3 px-4'>{t('location.list.name')}</th>
              <th className='py-3 px-4'>{t('location.list.status')}</th>
              <th className='py-3 px-4'>{t('location.list.actions')}</th>
            </tr>
          </thead>

          <tbody>
            {isLoading && locations.length === 0 ? (
              <tr>
                <td colSpan='3' className='py-6 text-center text-gray-400'>
                  {t('location.list.loading')}
                </td>
              </tr>
            ) : locations.length === 0 ? (
              <tr>
                <td colSpan='3' className='py-6 text-center text-gray-400'>
                  {t('location.list.noData')}
                </td>
              </tr>
            ) : (
              locations.map(location => (
                <LocationRow key={location.id} location={location} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <LocationFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        locationToEdit={locationToEdit}
        isLoaded={isMapLoaded}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
        title={t('location.delete.title', {
          name: locationToDelete?.name || ''
        })}
        message={t('location.delete.message', {
          name: locationToDelete?.name
        })}
        confirmText={t('location.delete.confirm')}
      />
    </div>
  )
}

export default LocationList

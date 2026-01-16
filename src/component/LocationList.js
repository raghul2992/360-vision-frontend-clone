import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import {
  getLocations,
  deleteLocation,
  updateLocation
} from '../features/locations/locationApiSlice'
import { fetchTenantsUsers } from '../features/userManagement/userApiSlice'
import ButtonComponent from './Button'
import LocationFormModal from './LocationFormModal'
import ConfirmationModal from './ConfirmationModal'
import {
  IoTrashOutline,
  IoPencilOutline,
  IoAddCircleOutline
} from 'react-icons/io5'

const LocationList = ({ isMapLoaded, readOnly }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  // Get location state
  const { locations, isLoading } = useSelector(state => state.locationApi)

  const users = localStorage.getItem('user_id')
  const tenantId = localStorage.getItem('tenant_id')

  // Local state to store the IDs fetched from the API
  const [assignedLocationIds, setAssignedLocationIds] = useState([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [locationToEdit, setLocationToEdit] = useState(null)
  const [locationToDelete, setLocationToDelete] = useState(null)

  // 3. Fetch Locations (All)
  useEffect(() => {
    if (tenantId) {
      dispatch(getLocations({ tenantId }))
    }
  }, [dispatch, tenantId])

  // 4. Fetch User Data to get assigned locations (Only if Viewer/ReadOnly)
  useEffect(() => {
    if (readOnly && tenantId && users) {
      dispatch(fetchTenantsUsers({ tenant_id: tenantId, user_id: users }))
        .unwrap()
        .then(usersData => {
          const currentUserData = usersData?.[0] // safest

          setAssignedLocationIds(currentUserData?.meta?.assign_locations || [])
        })
        .catch(err => {
          console.error('Failed to fetch user assignments', err)
          setAssignedLocationIds([])
        })
    }
  }, [dispatch, readOnly, tenantId, users])

  // 5. Filter Logic: Compare loaded locations against the fetched API IDs
  const visibleLocations = readOnly
    ? locations.filter(loc => assignedLocationIds.includes(String(loc.id)))
    : locations

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

  const handleConfirmDelete = async () => {
    if (tenantId && locationToDelete) {
      const res = await dispatch(
        deleteLocation({ tenantId, locationId: locationToDelete.id })
      )

      if (res?.payload?.data?.message) {
        toast.success(t('location.delete.delete_message'))
      }

      dispatch(getLocations({ tenantId }))

      handleCloseConfirm()
    }
  }

  // ⬇⬇⬇ STATUS CHANGE FUNCTION
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
      dispatch(getLocations({ tenantId }))
    } catch (error) {
      toast.error(t('location.update.statusUpdateFailed'))
    }
  }

  // 🔹 UPDATED LocationRow
  const LocationRow = ({ location }) => (
    <tr className='border-b border-gray-700/30 hover:bg-[#32333F] transition-colors'>
      <td className='py-3 px-4 text-white text-sm font-medium'>
        {location.name}
      </td>

      {/* STATUS DROPDOWN */}
      <td className='py-3 px-4 text-gray-300 text-xs font-semibold'>
        <select
          value={location.status}
          disabled={readOnly}
          onChange={e => handleStatusChange(location, e.target.value)}
          className={`px-2 py-1 rounded-md text-xs font-semibold bg-[#1f1f27] border 
            ${
              location.status === 'active'
                ? 'text-green-300 border-green-700'
                : 'text-red-300 border-red-700'
            }
            ${readOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <option value='active' className='text-green-500'>
            Active
          </option>
          <option value='inactive' className='text-red-500'>
            Inactive
          </option>
        </select>
      </td>

      {/* Hide Actions Column Cells if readOnly */}
      {!readOnly && (
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
      )}
    </tr>
  )

  return (
    <div className='relative'>
      <div className='flex justify-between mb-4 items-center'>
        <h2 className='text-xl font-semibold text-white'>
          {t('location.list.title')}
        </h2>

        {/* Hide Add Button if readOnly */}
        {!readOnly && (
          <ButtonComponent
            onClick={handleOpenCreate}
            className='flex items-center bg-[#3885CC] hover:bg-[#2A6DA8] text-white 
                    py-2.5 px-4 rounded-full font-semibold shadow-md'
          >
            <IoAddCircleOutline size={20} className='mr-2' />
            {t('location.management.addLocationButton')}
          </ButtonComponent>
        )}
      </div>

      <div className='overflow-x-auto rounded-lg shadow-lg'>
        <table className='min-w-full table-auto bg-[#262732] rounded-xl overflow-hidden'>
          <thead>
            <tr className='bg-[#343544] text-left text-xs font-semibold uppercase text-gray-300 tracking-wider'>
              <th className='py-3 px-4'>{t('location.list.name')}</th>
              <th className='py-3 px-4'>{t('location.list.status')}</th>
              {/* Hide Actions Header if readOnly */}
              {!readOnly && (
                <th className='py-3 px-4'>{t('location.list.actions')}</th>
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading && visibleLocations.length === 0 ? (
              <tr>
                <td
                  colSpan={readOnly ? '2' : '3'}
                  className='py-6 text-center text-gray-400'
                >
                  {t('location.list.loading')}
                </td>
              </tr>
            ) : visibleLocations.length === 0 ? (
              <tr>
                <td
                  colSpan={readOnly ? '2' : '3'}
                  className='py-6 text-center text-gray-400'
                >
                  {t('location.list.noData')}
                </td>
              </tr>
            ) : (
              visibleLocations.map(location => (
                <LocationRow key={location.id} location={location} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <>
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
        </>
      )}
    </div>
  )
}

export default LocationList

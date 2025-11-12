import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  IoWifiOutline,
  IoCloseCircle,
  IoWarning,
  IoPencil,
  IoTrashOutline,
  IoChevronDown,
  IoSearchOutline,
  IoLocationOutline,
  IoVideocamOutline,
  IoBan,
  IoClose,
  IoEllipsisHorizontal,
  IoCog,
  IoRefresh,
  IoAddCircleOutline
} from 'react-icons/io5'
import { FaCircleNotch } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { bgcolors } from '../../theme'
import { Link } from 'react-router-dom'
import { getCameras, deleteCamera } from '../../features/cameras/cameraApiSlice'
import { getLocations } from '../../features/locations/locationApiSlice'
import { toast } from 'react-toastify'

const CameraList = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { cameras, isLoading, error } = useSelector(state => state.cameraApi)
  const { locations, isLoading: locationsLoading } = useSelector(
    state => state.locationApi
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deletePopup, setDeletePopup] = useState({
    isOpen: false,
    cameraId: null,
    cameraName: ''
  })

  const tenantId = localStorage.getItem('tenant_id')

  useEffect(() => {
    if (tenantId) {
      dispatch(getCameras({ tenantId }))
      dispatch(getLocations(tenantId))
    }
  }, [dispatch, tenantId])

  const handleDeleteClick = (cameraId, cameraName) => {
    setDeletePopup({
      isOpen: true,
      cameraId,
      cameraName
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deletePopup.cameraId) return

    try {
      await dispatch(
        deleteCamera({ tenantId, cameraId: deletePopup.cameraId })
      ).unwrap()
      toast.success('Camera deleted successfully!')
      dispatch(getCameras({ tenantId }))
    } catch (error) {
      toast.error('Failed to delete camera: ' + error)
    } finally {
      setDeletePopup({ isOpen: false, cameraId: null, cameraName: '' })
    }
  }

  const handleDeleteCancel = () => {
    setDeletePopup({ isOpen: false, cameraId: null, cameraName: '' })
  }

  const filteredCameras = cameras.filter(camera => {
    const matchesSearch = camera.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesLocation =
      !locationFilter || camera.location_id?.toString() === locationFilter
    const matchesStatus = !statusFilter || camera.status === statusFilter

    return matchesSearch && matchesLocation && matchesStatus
  })

  const handleClearFilters = () => {
    setSearchTerm('')
    setLocationFilter('')
    setStatusFilter('')
  }

  const getStatusIcon = status => {
    switch (status) {
      case 'active':
        return (
          <div
            className='w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30'
            title='Active'
          >
            <IoWifiOutline className='text-green-400' size={24} />
          </div>
        )
      case 'inactive':
        return (
          <div
            className='w-12 h-12 rounded-xl bg-gray-500/20 flex items-center justify-center border border-gray-500/30'
            title='Inactive'
          >
            <IoBan className='text-gray-400' size={24} />
          </div>
        )
      case 'processing':
        return (
          <div
            className='w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30'
            title='Processing'
          >
            <FaCircleNotch className='text-orange-500 animate-spin' size={24} />
          </div>
        )
      case 'error':
        return (
          <div
            className='w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30'
            title='Error'
          >
            <IoCloseCircle className='text-red-400' size={24} />
          </div>
        )
      default:
        return (
          <div
            className='w-12 h-12 rounded-xl bg-gray-500/20 flex items-center justify-center border border-gray-500/30'
            title='Unknown Status'
          >
            <IoWifiOutline className='text-gray-400' size={24} />
          </div>
        )
    }
  }

  return (
    <div className='text-white'>
      {/* Delete Confirmation Popup */}
      {deletePopup.isOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-[#2A2B36] rounded-xl p-6 max-w-md w-full border border-gray-700/50'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold'>Confirm Deletion</h3>
              <button
                onClick={handleDeleteCancel}
                className='text-gray-400 hover:text-white transition-colors'
              >
                <IoClose size={24} />
              </button>
            </div>

            <div className='mb-6'>
              <p className='text-gray-300'>
                Are you sure you want to delete the camera{' '}
                <span className='font-semibold text-white'>
                  "{deletePopup.cameraName}"
                </span>
                ?
              </p>
              <p className='text-sm text-red-400 mt-2'>
                This action cannot be undone and all associated ROI
                configurations will be lost.
              </p>
            </div>

            <div className='flex justify-end gap-3'>
              <button
                onClick={handleDeleteCancel}
                className='px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2'
              >
                <IoTrashOutline size={16} />
                Delete Camera
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='bg-[#30313F] rounded-xl p-5 mb-6 border border-[#DDDDDD]'>
        <div className='flex items-center gap-4'>
          <div className='flex-1 relative'>
            <IoSearchOutline
              className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500'
              size={18}
            />
            <input
              type='text'
              placeholder={
                t('cameraList.searchPlaceholder') || 'Search cameras names'
              }
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='w-full bg-[#4D4D4D] rounded-lg py-2.5 pl-10 pr-4 text-white text-sm placeholder-white focus:outline-none focus:border-gray-600'
            />
          </div>

          {/* Location Filter */}
          <div className='relative flex items-center bg-[#4D4D4D] border border-gray-700/50 rounded-lg text-white min-w-[180px]'>
            <IoLocationOutline className='ml-3 text-white' size={16} />
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className='appearance-none w-full bg-[#4D4D4D] border border-gray-700/50 rounded-lg py-2.5 pl-4 pr-10 text-white text-sm focus:outline-none cursor-pointer text-gray-300'
            >
              <option value=''>
                {t('cameraList.locationOption') || 'All Locations'}
              </option>
              {locations?.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <IoChevronDown
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none'
              size={16}
            />
          </div>

          <div className='relative'>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className='appearance-none bg-[#4D4D4D] rounded-lg py-2.5 pl-4 pr-10 text-white text-sm focus:outline-none cursor-pointer min-w-[180px]'
            >
              <option value=''>
                {t('cameraList.statusOption') || 'All Status'}
              </option>
              <option value='active'>Active</option>
              <option value='inactive'>Inactive</option>
              <option value='processing'>Processing</option>
              <option value='error'>Error</option>
            </select>
            <IoChevronDown
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none'
              size={16}
            />
          </div>

          <div className='flex gap-3'>
            <button
              onClick={handleClearFilters}
              className='bg-[#4D4D4D] border border-gray-700/50 text-gray-300 font-medium py-2.5 px-6 rounded-lg transition-colors text-sm'
            >
              {t('cameraList.clearButton') || 'Clear'}
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <p className='text-center text-gray-400'>
          {t('cameraList.loading') || 'Loading cameras...'}
        </p>
      )}
      {error && (
        <p className='text-center text-red-400'>
          {t('cameraList.error') || 'Error loading cameras.'}: {error}
        </p>
      )}
      {!isLoading && filteredCameras.length === 0 && (
        <p className='text-center text-gray-400'>
          {t('cameraList.noCameras') || 'No cameras found.'}
        </p>
      )}
      <div className='flex flex-col gap-4'>
        {filteredCameras.map(camera => (
          <div
            key={camera.id}
            className='bg-[#2A2B36] rounded-xl p-5 flex items-center justify-between border border-gray-700/50 hover:border-gray-600/50 transition-all'
          >
            <div className='flex items-center gap-4'>
              {getStatusIcon(camera.status)}
              <div>
                <h3 className='font-semibold text-base mb-1'>{camera.name}</h3>
                <div className='flex items-center gap-2 text-sm text-gray-400'>
                  <IoLocationOutline className='w-4 h-4' />
                  <span className='max-w-[50%]'>
                    Location:{' '}
                    {locations.find(loc => loc.id === camera.location_id)
                      ?.name || 'N/A'}
                  </span>
                  <span className='mx-2 text-gray-600'>|</span>
                  <IoVideocamOutline className='w-4 h-4' />
                  <span className='font-mono text-xs truncate max-w-xs'>
                    {camera.rtsp_url}
                  </span>
                </div>
                {camera.status === 'error' && camera.meta?.error?.message && (
                  <p style={{ color: '#f87171' }} className='mt-2 text-xs'>
                    <span className='text-sm'>Error: </span>
                    {camera.meta.error.message}
                  </p>
                )}
              </div>
            </div>
            <div className='flex items-center gap-4'>
              <Link to={`/add-camera?id=${camera.id}`}>
                <button className='flex items-center gap-2 px-4 py-2 rounded-lg border border-[#0088FF] text-gray-300 hover:text-white hover:border-gray-600 transition-all text-sm'>
                  <IoPencil size={16} />
                  {t('cameraList.editButton') || 'Edit'}
                </button>
              </Link>
              <button
                onClick={() => handleDeleteClick(camera.id, camera.name)}
                className='p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all'
              >
                <IoTrashOutline size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CameraList

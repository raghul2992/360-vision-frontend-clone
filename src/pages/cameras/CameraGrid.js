import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  IoPencil,
  IoTrashOutline,
  IoEllipsisHorizontal,
  IoCopyOutline,
  IoSearchOutline,
  IoChevronDown,
  IoLocationOutline,
  IoRadio,
  IoClose
} from 'react-icons/io5'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { getCameras, deleteCamera } from '../../features/cameras/cameraApiSlice'
import { toast } from 'react-toastify'

const CameraGrid = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { cameras, isLoading, error } = useSelector(state => state.cameraApi)
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deletePopup, setDeletePopup] = useState({
    isOpen: false,
    cameraId: null,
    cameraName: ''
  })

  const tenantId = localStorage.getItem("tenant_id")

  useEffect(() => {
    console.log(localStorage.getItem("tenant_id"))
    dispatch(getCameras({ tenantId }))
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

  const handleCopyUrl = url => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied to clipboard!')
  }

  const filteredCameras = cameras.filter(camera => {
    const matchesSearch =
      camera.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camera.rtsp_url?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLocation =
      !locationFilter || camera.location_id?.toString() === locationFilter
    const matchesStatus = !statusFilter || camera.status === statusFilter

    return matchesSearch && matchesLocation && matchesStatus
  })

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'processing', label: 'Processing' },
    { value: 'error', label: 'Error' }
  ]

  const getStatusClasses = status => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border border-green-500/30'
      case 'inactive':
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
      case 'processing':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
      case 'error':
        return 'bg-red-500/20 text-red-400 border border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
    }
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setLocationFilter('')
    setStatusFilter('')
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

      {/* Filter Section */}
      <div className='bg-[#30313F] rounded-xl p-5 mb-6 border border-[#DDDDDD]'>
        <div className='flex items-center gap-4 flex-wrap'>
          {/* Search input */}
          <div className='flex-1 relative min-w-[240px]'>
            <IoSearchOutline
              className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500'
              size={18}
            />
            <input
              type='text'
              placeholder={
                t('cameraGrid.searchPlaceholder') ||
                'Search cameras by names or locations'
              }
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='w-full bg-[#4D4D4D] rounded-lg py-2.5 pl-10 pr-4 text-white text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          {/* Location dropdown */}
          <div className='relative flex items-center bg-[#4D4D4D] border border-gray-700/50 rounded-lg text-white min-w-[180px]'>
            <IoLocationOutline className='ml-3 text-gray-300' size={16} />
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className='appearance-none w-full bg-[#4D4D4D] border border-gray-700/50 rounded-lg py-2.5 pl-4 pr-10 text-white text-sm focus:outline-none cursor-pointer text-gray-300'
            >
              <option value=''>
                {t('cameraList.locationOption') || 'All Locations'}
              </option>
              <option value='1'>Location 1</option>
              <option value='2'>Location 2</option>
            </select>
            <IoChevronDown
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none'
              size={16}
            />
          </div>

          {/* Status dropdown */}
          <div className='relative min-w-[180px]'>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className='appearance-none w-full bg-[#4D4D4D] border border-gray-700/50 rounded-lg py-2.5 pl-4 pr-10 text-white text-sm focus:outline-none cursor-pointer text-gray-300'
            >
              <option value=''>
                {t('cameraList.statusOption') || 'All Status'}
              </option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <IoChevronDown
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none'
              size={16}
            />
          </div>

          {/* Action buttons */}
          <div className='flex gap-3 ml-auto'>
            <button
              onClick={handleClearFilters}
              className='bg-[#4D4D4D] border border-gray-700/50 text-gray-300 font-medium py-2.5 px-6 rounded-lg transition-colors text-sm hover:bg-[#5A5A5A]'
            >
              {t('cameraList.clearButton') || 'Clear'}
            </button>
          </div>
        </div>
      </div>

      {/* Camera Grid */}
      {isLoading && (
        <p className='text-center text-gray-400'>{'Loading cameras...'}</p>
      )}
      {error && (
        <p className='text-center text-red-400'>
          {t('cameraGrid.error') || 'Error loading cameras.'}: {error}
        </p>
      )}
      {!isLoading && filteredCameras.length === 0 && (
        <p className='text-center text-gray-400'>{'No cameras found.'}</p>
      )}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6'>
        {filteredCameras.map(camera => (
          <div
            key={camera.id}
            className='bg-[#2A2B36] rounded-xl p-5 border border-gray-700/50 hover:border-gray-600/50 transition-all flex flex-col h-full min-h-[240px]'
          >
            {/* Header */}
            <div className='flex justify-between items-start mb-4'>
              <div className='flex-1 min-w-0'>
                <h2
                  className='text-lg font-semibold mb-1 truncate'
                  title={camera.name}
                >
                  {camera.name}
                </h2>
                <p
                  className='text-sm text-gray-400 truncate'
                  title={camera.location_id}
                >
                  Location: {camera.location_id || 'N/A'}
                </p>
              </div>
              <div className='relative inline-flex items-center'>
                <span
                  className={`px-3 py-1 rounded-[9px] text-xs font-medium ${getStatusClasses(
                    camera.status
                  )} flex items-center gap-1.5 shrink-0 ml-2`}
                >
                  {camera.status === 'active'
                    ? 'Active'
                    : camera.status === 'inactive'
                    ? 'Inactive'
                    : camera.status === 'processing'
                    ? 'Processing'
                    : camera.status === 'error'
                    ? 'Error'
                    : 'Unknown'}
                </span>
              </div>
            </div>

            {/* Stream URL */}
            <div className='mb-4 flex-1'>
              <p className='text-xs text-gray-500 mb-2'>
                {t('cameraGrid.streamUrlLabel') || 'Stream URL'}
              </p>
              <div className='bg-[#1E1F28] rounded-lg p-2.5 flex items-center justify-between group hover:bg-[#252632] transition-colors'>
                <p className='text-xs text-gray-400 font-mono truncate flex-1 mr-2'>
                  {camera.rtsp_url}
                </p>
                <button
                  onClick={() => handleCopyUrl(camera.rtsp_url)}
                  className='text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-gray-700/50 flex-shrink-0'
                  title='Copy stream URL'
                >
                  <IoCopyOutline size={16} />
                </button>
              </div>
            </div>

            {/* Footer actions */}
            <div className='flex justify-between items-center pt-4 border-t border-gray-700/50 mt-auto'>
              <Link
                // to={`/roi-configuration?cameraId=${camera.rois[0]?.id}`}
                className='flex items-center'
              >
                <button className='flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm'>
                  <IoRadio size={16} />
                  {t('cameraGrid.roiButton') || 'ROI'}
                </button>
              </Link>
              <div className='flex gap-3'>
                <Link
                  to={`/add-camera?id=${camera.id}`}
                  className='flex items-center'
                >
                  <button className='flex items-center gap-2 px-2 py-2 rounded-lg border border-[#0088FF] text-gray-300 hover:text-white hover:border-gray-600 transition-all text-[12px]'>
                    <IoPencil size={13} />
                    {t('cameraGrid.editButton') || 'Edit'}
                  </button>
                </Link>
                <button
                  onClick={() => handleDeleteClick(camera.id, camera.name)}
                  className='text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-500/10'
                  title='Delete camera'
                >
                  <IoTrashOutline size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CameraGrid

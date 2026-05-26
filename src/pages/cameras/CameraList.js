import React, { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  WifiIcon,
  ChevronDownIcon,
  SearchIcon,
  MapPinIcon,
  VideoIcon,
  BanIcon,
  EyeIcon,
  TrashIcon,
  CloseCircleIcon,
  FilterIcon,
  CloseIcon,
  AlertCircleIcon,
  SpinnerIcon,
} from '../../icons'
import { useTranslation } from 'react-i18next'
import { bgcolors, textcolors, textSizes, borderstyles, buttons, colors, iconSizes } from '../../theme'
import { Link } from 'react-router-dom'
import { getCameras, deleteCamera } from '../../features/cameras/cameraApiSlice'
import { getLocations } from '../../features/locations/locationApiSlice'
import { toast } from 'react-toastify'
import CameraStatusSummary from './component/CameraStatusSummary'

const CustomSelect = ({ value, onChange, options, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleOutside = e => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className='relative w-full'>
      {/* Trigger */}
      <button
        type='button'
        onClick={() => setIsOpen(p => !p)}
        className={`flex items-center gap-2 w-full px-3 py-2.5 ${bgcolors.surface} ${borderstyles.light} rounded-xl ${textSizes.subtitle} cursor-pointer focus:outline-none ${borderstyles.focusRing} transition-all`}
      >
        <span className={`flex-shrink-0 ${textcolors.dim}`}>{icon}</span>
        <span className={`flex-1 text-left truncate ${selected ? textcolors.normaltext : textcolors.dim}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon
          size={14}
          className={`flex-shrink-0 ${textcolors.dim} transition-transform duration-200`}
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Dropdown list */}
      {isOpen && (
        <div className={`absolute top-full left-0 mt-1.5 w-full ${bgcolors.white} rounded-xl ${borderstyles.light} shadow-lg z-50 overflow-hidden py-1`}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false) }}
              className={`px-4 py-2.5 ${textSizes.subtitle} cursor-pointer transition-colors rounded-lg mx-1 ${
                value === opt.value
                  ? `${bgcolors.primary} text-white font-semibold`
                  : `${textcolors.normaltext} ${bgcolors.accentHover} ${textcolors.accentHover}`
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const CameraList = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { cameras, isLoading, error } = useSelector(state => state.cameraApi)
  const { locations } = useSelector(state => state.locationApi)
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
      dispatch(getLocations({ tenantId }))
    }
  }, [dispatch, tenantId])

  const handleDeleteClick = (cameraId, cameraName) => {
    setDeletePopup({ isOpen: true, cameraId, cameraName })
  }

  const handleDeleteConfirm = async () => {
    if (!deletePopup.cameraId) return
    try {
      await dispatch(deleteCamera({ tenantId, cameraId: deletePopup.cameraId })).unwrap()
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

  const getStatusBorderColor = status => {
    switch (status) {
      case 'active':     return colors.success
      case 'inactive':   return colors.textMute
      case 'processing': return colors.orange
      case 'error':      return colors.danger
      default:           return colors.textMute
    }
  }

  const filteredCameras = cameras.filter(camera => {
    const matchesSearch = camera.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLocation = !locationFilter || camera.location_id?.toString() === String(locationFilter)
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
          <div className={`w-12 h-12 rounded-xl ${bgcolors.successLight} flex items-center justify-center ${borderstyles.successBorder}`} title='Active'>
            <WifiIcon className={textcolors.success} size={iconSizes.large} />
          </div>
        )
      case 'inactive':
        return (
          <div className={`w-12 h-12 rounded-xl ${bgcolors.grayLight} flex items-center justify-center ${borderstyles.light}`} title='Inactive'>
            <BanIcon className={textcolors.muted} size={iconSizes.large} />
          </div>
        )
      case 'processing':
        return (
          <div className={`w-12 h-12 rounded-xl ${bgcolors.orangeLight} flex items-center justify-center ${borderstyles.orangeBorder}`} title='Processing'>
            <SpinnerIcon className={`${textcolors.orange} animate-spin`} size={iconSizes.large} />
          </div>
        )
      case 'error':
        return (
          <div className={`w-12 h-12 rounded-xl ${bgcolors.dangerFaint} flex items-center justify-center ${borderstyles.dangerBorder}`} title='Error'>
            <CloseCircleIcon className={textcolors.danger} size={iconSizes.large} />
          </div>
        )
      default:
        return (
          <div className={`w-12 h-12 rounded-xl ${bgcolors.grayLight} flex items-center justify-center ${borderstyles.light}`} title='Unknown'>
            <WifiIcon className={textcolors.muted} size={iconSizes.large} />
          </div>
        )
    }
  }

  return (
    <div>
      {/* Delete Confirmation Popup */}
      {deletePopup.isOpen && (
        <div className={`fixed inset-0 ${bgcolors.overlay} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
          <div className={`${bgcolors.white} rounded-2xl p-6 max-w-sm w-full ${borderstyles.light} shadow-2xl text-center`}>
            <div className='flex justify-center mb-4'>
              <div className={`w-12 h-12 rounded-full ${bgcolors.dangerFaint} flex items-center justify-center ${borderstyles.dangerBorder}`}>
                <TrashIcon className={textcolors.danger} size={22} />
              </div>
            </div>
            <h3 className={`text-lg font-bold mb-2 ${textcolors.normaltext}`}>
              {t('cameraGrid.deletePopup.title')}
            </h3>
            <p className={`${textcolors.dim} ${textSizes.subtitle} mb-2`}>
              {t('cameraGrid.deletePopup.message', { cameraName: deletePopup.cameraName })}
            </p>
            <p className={`${textcolors.danger} text-xs mb-6`}>
              {t('cameraGrid.deletePopup.warning')}
            </p>
            <div className='flex gap-3'>
              <button
                onClick={handleDeleteCancel}
                className={`flex-1 py-2.5 rounded-xl ${buttons.secondary}`}
              >
                {t('cameraGrid.deletePopup.cancelButton')}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className={`flex-1 py-2.5 rounded-xl ${buttons.danger} flex items-center justify-center gap-2`}
              >
                <TrashIcon size={16} />
                {t('cameraGrid.deletePopup.deleteButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className={`${bgcolors.white} rounded-xl p-4 mb-6 ${borderstyles.light} shadow-sm`}>
        <div className='flex flex-col sm:flex-row flex-wrap gap-3'>
          {/* Search */}
          <div className='flex-1 min-w-0 relative'>
            <SearchIcon
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${textcolors.dim}`}
              size={16}
            />
            <input
              type='text'
              placeholder={t('cameraList.searchPlaceholder') || 'Search camera names'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full ${bgcolors.surface} ${borderstyles.light} rounded-lg py-2.5 pl-9 pr-4 ${textcolors.normaltext} ${textSizes.subtitle} ${textcolors.placeholder} focus:outline-none ${borderstyles.focusRing}`}
            />
          </div>

          {/* Location Filter */}
          <div className='w-full sm:w-52'>
            <CustomSelect
              value={locationFilter}
              onChange={val => setLocationFilter(val)}
              placeholder={t('cameraList.locationOption') || 'Location'}
              icon={<MapPinIcon size={iconSizes.dropdown} />}
              options={locations?.map(loc => ({ value: String(loc.id), label: loc.name })) || []}
            />
          </div>

          {/* Status Filter */}
          <div className='w-full sm:w-44'>
            <CustomSelect
              value={statusFilter}
              onChange={val => setStatusFilter(val)}
              placeholder={t('cameraList.statusOption') || 'Select Status'}
              icon={<FilterIcon size={iconSizes.dropdown} />}
              options={[
                { value: 'active',     label: 'Active'     },
                { value: 'inactive',   label: 'Inactive'   },
                { value: 'processing', label: 'Processing' },
                { value: 'error',      label: 'Error'      },
              ]}
            />
          </div>

          {/* Clear Button */}
          <button
            onClick={handleClearFilters}
            className={`${buttons.secondary} flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg ${textSizes.subtitle} w-full sm:w-auto`}
          >
            <CloseIcon size={16} />
            {t('cameraList.clearButton') || 'Clear'}
          </button>
        </div>
      </div>

      <CameraStatusSummary cameras={filteredCameras} />

      {/* Loading */}
      {isLoading && (
        <div className={`${bgcolors.white} rounded-xl p-6 ${borderstyles.light} shadow-sm mb-4 text-center ${textcolors.dim} ${textSizes.subtitle}`}>
          {t('cameraList.loading') || 'Loading cameras...'}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={`${bgcolors.white} rounded-xl p-6 ${borderstyles.light} shadow-sm mb-4 text-center ${textcolors.danger} ${textSizes.subtitle}`}>
          {t('cameraList.error') || 'Error loading cameras.'}: {error}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filteredCameras.length === 0 && (
        <div className={`${bgcolors.white} rounded-xl p-6 ${borderstyles.light} shadow-sm mb-4 text-center ${textcolors.dim} ${textSizes.subtitle}`}>
          {t('cameraList.noCameras') || 'No cameras found.'}
        </div>
      )}

      {/* Camera Cards */}
      <div className='flex flex-col gap-3'>
        {filteredCameras.map(camera => (
          <div
            key={camera.id}
            className={`relative ${bgcolors.white} rounded-xl p-3 sm:p-4 pl-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm hover:shadow-md transition-all duration-200 ${borderstyles.light} ${borderstyles.hoverAccentLight} overflow-hidden`}
          >
            <span
              className='absolute left-0 top-3 bottom-3 w-1 rounded-r-full'
              style={{ backgroundColor: getStatusBorderColor(camera.status) }}
            />
            {/* Left: icon + info */}
            <div className='flex items-center gap-3 min-w-0'>
              {getStatusIcon(camera.status)}
              <div className='min-w-0'>
                <h3 className={`font-semibold text-base mb-1 ${textcolors.normaltext}`}>
                  {camera.name}
                </h3>
                <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${textSizes.subtitle} ${textcolors.dim}`}>
                  <span className='flex items-center gap-1'>
                    <MapPinIcon size={14} />
                    {t('cameraGrid.locationLabel')}:{' '}
                    {locations.find(loc => loc.id === camera.location_id)?.name || 'N/A'}
                  </span>
                  <span className={`hidden sm:inline ${textcolors.disabled}`}>|</span>
                  <span className='flex items-center gap-1.5 min-w-0'>
                    <VideoIcon size={14} className='flex-shrink-0' />
                    <span className='font-mono text-xs truncate max-w-[200px] sm:max-w-xs'>{camera.rtsp_url}</span>
                  </span>
                </div>
                {camera.status === 'error' && camera.meta?.error?.message && (
                  <div className='flex items-center gap-1.5 mt-1.5'>
                    <AlertCircleIcon size={14} className={`${textcolors.danger} flex-shrink-0`} />
                    <span className={`text-xs ${textcolors.danger}`}>{camera.meta.error.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: actions */}
            <div className='flex items-center gap-3 flex-shrink-0 self-end sm:self-auto'>
              <Link to={`/add-camera?id=${camera.id}`}>
                <button className={`flex items-center gap-2 px-4 py-2 rounded-lg ${borderstyles.accentSoft} ${textcolors.accentText} ${bgcolors.accentHover} transition-all ${textSizes.subtitle} font-medium`}>
                  <EyeIcon size={16} />
                  {t('cameraList.viewButton') || 'View'}
                </button>
              </Link>
              <button
                onClick={() => handleDeleteClick(camera.id, camera.name)}
                className={`p-2 rounded-lg ${textcolors.muted} ${textcolors.hoverDanger} ${bgcolors.dangerHover} transition-all`}
              >
                <TrashIcon size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CameraList

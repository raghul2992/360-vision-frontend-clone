import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import { toast } from 'react-toastify'
import { IoClose, IoChevronDown, IoLocationOutline } from 'react-icons/io5'
import { getLocations } from '../../../features/locations/locationApiSlice'
import { updateTenantUser } from '../../../features/userManagement/userApiSlice'

const containerStyle = { width: '100%', height: '100%' }
// Default center (Brazil roughly, adjust as needed)
const defaultCenter = { lat: -14.235, lng: -51.9253 }

const mapOptions = {
  disableDefaultUI: true,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] }
  ]
}

const UpdateUserModal = ({ isOpen, onClose, tenantId, userData }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { isLoading: isUpdating } = useSelector(state => state.users)

  const { locations = [] } = useSelector(
    state => state.locations || state.locationApi || {}
  )

  const [formData, setFormData] = useState({
    full_name: '',
    role: '',
    status: '',
    meta: { assign_locations: [] }
  })

  // ------------------------------------------------------------------
  // 1. Role Logic: Determine available roles based on current user
  // ------------------------------------------------------------------
  const currentUserRole = localStorage.getItem('user_role') // 'admin', 'operator', or 'viewer'

  const getAvailableRoles = role => {
    switch (role) {
      case 'admin':
        return ['admin', 'operator', 'viewer']
      case 'operator':
        return ['operator', 'viewer'] // Operator cannot create/edit Admins
      case 'viewer':
        return [] // Viewers usually can't manage users
      default:
        return []
    }
  }

  const availableOptions = getAvailableRoles(currentUserRole)

  // ------------------------------------------------------------------
  // 2. State & Effects
  // ------------------------------------------------------------------
  useEffect(() => {
    if (userData) {
      setFormData({
        full_name: userData.full_name || '',
        role: userData.role || 'viewer',
        status: userData.status || 'active',
        meta: {
          ...userData.meta,
          assign_locations: userData.meta?.assign_locations || []
        }
      })
    }
  }, [userData])

  useEffect(() => {
    if (isOpen && tenantId) {
      dispatch(getLocations({ tenantId }))
    }
  }, [isOpen, tenantId, dispatch])

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  })

  const handleChange = e => {
    const { name, value } = e.target
    if (name === 'role' && value !== 'viewer') {
      // If role changes from viewer to something else, clear locations (optional logic)
      setFormData(prev => ({
        ...prev,
        [name]: value,
        meta: { ...prev.meta, assign_locations: [] }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Logic to handle IDs consistently
  const handleLocationToggle = locationId => {
    if (!locationId || locationId === 'default') return

    const idStr = String(locationId)

    setFormData(prev => {
      const currentLocs = prev.meta.assign_locations || []
      const isSelected = currentLocs.some(id => String(id) === idStr)

      return {
        ...prev,
        meta: {
          ...prev.meta,
          assign_locations: isSelected
            ? currentLocs.filter(id => String(id) !== idStr)
            : [...currentLocs, idStr]
        }
      }
    })
  }

  const handleSubmit = async () => {
    try {
      await dispatch(
        updateTenantUser({
          tenant_id: tenantId,
          user_id: userData.id,
          ...formData
        })
      ).unwrap()
      toast.success(t('userManagement.updateModal.successToast'))
      onClose()
    } catch (err) {
      toast.error(err || t('userManagement.updateModal.errorToast'))
    }
  }

  // Helper to get name from ID for display chips
  const getLocationName = id => {
    const loc = locations.find(l => String(l.id) === String(id))
    return loc ? loc.name : id
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4'>
      <div className='bg-[#2c2d3a] w-full max-w-3xl rounded-2xl border border-gray-700 max-h-[90vh] flex flex-col shadow-2xl overflow-hidden'>
        {/* Header */}
        <div className='flex justify-between items-center p-6 border-b border-gray-700/50'>
          <h2 className='text-2xl font-semibold text-white'>
            {t('userManagement.updateModal.title')}
          </h2>
          <IoClose
            className='text-2xl cursor-pointer text-gray-400 hover:text-white transition-colors'
            onClick={onClose}
          />
        </div>

        {/* Body */}
        <div className='p-6 space-y-5 overflow-y-auto custom-scrollbar'>
          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium text-gray-300 block mb-2'>
                {t('userManagement.updateModal.fullName')}
              </label>
              <input
                type='text'
                name='full_name'
                value={formData.full_name}
                onChange={handleChange}
                className='w-full bg-[#1c1c24] border border-gray-700 rounded-lg py-3 px-4 text-white outline-none focus:border-blue-500 transition-all'
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              {/* Role Select */}
              <div>
                <label className='text-sm font-medium text-gray-300 block mb-2'>
                  {t('userManagement.updateModal.role')}
                </label>
                <div className='relative'>
                  <select
                    name='role'
                    value={formData.role}
                    onChange={handleChange}
                    className='w-full bg-[#1c1c24] appearance-none border border-gray-700 rounded-lg py-3 px-4 text-white outline-none cursor-pointer focus:border-blue-500'
                  >
                    {/* Map over allowed roles only */}
                    {availableOptions.map(role => (
                      <option key={role} value={role}>
                        {t(`userManagement.roles.${role}`)}
                      </option>
                    ))}
                  </select>
                  <IoChevronDown className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none' />
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className='text-sm font-medium text-gray-300 block mb-2'>
                  {t('userManagement.updateModal.status')}
                </label>
                <div className='relative'>
                  <select
                    name='status'
                    value={formData.status}
                    onChange={handleChange}
                    className='w-full bg-[#1c1c24] appearance-none border border-gray-700 rounded-lg py-3 px-4 text-white outline-none cursor-pointer focus:border-blue-500'
                  >
                    <option value='active'>
                      {t('userManagement.updateModal.active')}
                    </option>
                    <option value='inactive'>
                      {t('userManagement.updateModal.inactive')}
                    </option>
                  </select>
                  <IoChevronDown className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none' />
                </div>
              </div>
            </div>
          </div>

          {/* Location Section - Only visible if role is viewer */}
          {formData.role === 'viewer' && (
            <div className='space-y-5 pt-4 border-t border-gray-700/50 animate-in fade-in duration-300'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-300'>
                  {t('userManagement.updateModal.locationVisibility')}
                </label>

                {/* 3. Map Section with Colored Markers */}
                <div className='w-full h-40 rounded-xl overflow-hidden border border-gray-700 bg-[#1c1c24]'>
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={containerStyle}
                      center={defaultCenter}
                      zoom={3}
                      options={mapOptions}
                    >
                      {locations.map(loc => {
                        // Check if ID is selected
                        const isSelected = formData.meta.assign_locations.some(
                          id => String(id) === String(loc.id)
                        )
                        return (
                          <Marker
                            key={loc.id}
                            position={{
                              lat: parseFloat(loc.lat),
                              lng: parseFloat(loc.lang)
                            }}
                            onClick={() => handleLocationToggle(loc.id)}
                            // Differentiate Icon Color
                            icon={{
                              url: isSelected
                                ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' // Selected
                                : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' // Unselected
                            }}
                          />
                        )
                      })}
                    </GoogleMap>
                  ) : (
                    <div className='h-full flex items-center justify-center text-gray-500'>
                      {t('userManagement.loading')}
                    </div>
                  )}
                </div>
              </div>

              {/* Location Select Dropdown */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-300 block'>
                  {t('userManagement.updateModal.selectLocation')}
                </label>
                <div className='relative'>
                  <select
                    onChange={e => handleLocationToggle(e.target.value)}
                    value='default'
                    className='w-full bg-[#1c1c24] appearance-none border border-gray-700 rounded-lg py-3 px-4 text-gray-300 outline-none cursor-pointer focus:border-blue-500 transition text-sm'
                  >
                    <option value='default' disabled>
                      {t('userManagement.updateModal.searchLocation')}
                    </option>
                    {locations.map(loc => {
                      const isSelected = formData.meta.assign_locations.some(
                        id => String(id) === String(loc.id)
                      )
                      return (
                        <option
                          key={loc.id}
                          value={loc.id}
                          disabled={isSelected}
                        >
                          {loc.name}{' '}
                          {isSelected
                            ? `(${
                                t('userManagement.table.selected') || 'Selected'
                              })`
                            : ''}
                        </option>
                      )
                    })}
                  </select>
                  <IoChevronDown className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none' />
                </div>
              </div>

              {/* Display Chips */}
              <div className='bg-[#1c1c24] p-3 rounded-xl border border-gray-700'>
                <p className='text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-wider'>
                  {t('userManagement.updateModal.assignedCount', {
                    count: formData.meta.assign_locations.length
                  })}
                </p>
                <div className='flex flex-wrap gap-2'>
                  {formData.meta.assign_locations.length > 0 ? (
                    formData.meta.assign_locations.map(locId => (
                      <span
                        key={locId}
                        className='bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs flex items-center gap-2'
                      >
                        <IoLocationOutline size={12} />
                        {getLocationName(locId)}
                        <IoClose
                          className='cursor-pointer hover:text-white transition-colors'
                          onClick={() => handleLocationToggle(locId)}
                        />
                      </span>
                    ))
                  ) : (
                    <p className='text-xs text-gray-600 italic'>
                      {t('userManagement.updateModal.noLocations')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='p-6 border-t border-gray-700/50 flex gap-3 bg-[#2c2d3a]'>
          <button
            className='flex-1 py-3 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors'
            onClick={onClose}
          >
            {t('userManagement.updateModal.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUpdating}
            className='flex-1 py-3 rounded-xl bg-[#3885CC] text-white font-bold hover:bg-blue-600 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20'
          >
            {isUpdating
              ? t('userManagement.updateModal.updating')
              : t('userManagement.updateModal.updateUser')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpdateUserModal

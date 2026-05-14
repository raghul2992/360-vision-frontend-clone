import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
// import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import { toast } from 'react-toastify'
import {
  IoClose,
  IoChevronDown,
  IoLocationOutline,
  IoChevronForward
} from 'react-icons/io5'
import { getLocations } from '../../../features/locations/locationApiSlice'
import {
  addNewUser,
  inviteUser
} from '../../../features/userManagement/userApiSlice'
import generateRandomPassword from '../../../utils/generatePassword'

const AddUserModal = ({ isOpen, onClose, tenantId }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { isLoading: isCreating } = useSelector(state => state.users)
  const { locations = [] } = useSelector(state => state.locationApi)

  // Removed showInviteConfirm state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'admin',
    meta: { assign_locations: [] },
    password: generateRandomPassword()
  })

  const currentUserRole = localStorage.getItem('user_role')

  const getAvailableRoles = role => {
    switch (role) {
      case "superadmin":
        
        return [ "admin", "operator", "viewer"];
      case 'admin':
        return ['admin', 'operator', 'viewer']
      case 'operator':
        return ['operator', 'viewer']
      case 'viewer':
        return []
      default:
        return []
    }
  }

  const availableOptions = getAvailableRoles(currentUserRole)

  useEffect(() => {
    if (tenantId && isOpen) dispatch(getLocations({ tenantId }))
  }, [tenantId, isOpen, dispatch])

  // const { isLoaded } = useJsApiLoader({
  //   id: 'google-map-script',
  //   googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  // })

  const handleLocationToggle = locationId => {
    if (!locationId || locationId === 'default') return

    const targetId = locationId.toString()

    setFormData(prev => {
      const currentIds = prev.meta.assign_locations
      const isSelected = currentIds.includes(targetId)

      return {
        ...prev,
        meta: {
          ...prev.meta,
          assign_locations: isSelected
            ? currentIds.filter(id => id !== targetId)
            : [...currentIds, targetId]
        }
      }
    })
  }

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.email || !formData.password) {
      return toast.error(t('userManagement.errors.requiredFields'))
    }

    if (formData.role === 'viewer' && formData.meta.assign_locations.length === 0) {
      return toast.error( 'Please select at least one location for viewer.')
    }

    try {
      // 1. Create the User
      const res = await dispatch(
        addNewUser({ tenant_id: tenantId, ...formData })
      ).unwrap()
      console.log(res)
      // 2. Immediately Send Invitation
      try {
        await dispatch(
          inviteUser({
            tenant_id: tenantId,
            email: formData.email,
            redirect_url: window.location.origin + '/accept-invitation'
          })
        ).unwrap()

        // Success message for both actions
        toast.success(
          t('userManagement.toast.inviteSuccess') ||
            'User added and invitation sent!'
        )
      } catch (inviteErr) {
        // Handle case where user is created but invite fails
        console.error(inviteErr)
        toast.warning(
          'User added, but failed to send invitation email automatically.'
        )
      }

      // 3. Refresh List and Close Modal
      window.dispatchEvent(new CustomEvent('triggeruserapi', { detail: true }))
      onClose()
    } catch (err) {
      console.log(err)
      toast.error(err.message || t('userManagement.errors.addFailed'))
    }
  }

  // Removed separate handleSendInvitation function

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4'>
      <div className='bg-[#2c2d3a] w-full max-w-3xl rounded-2xl border border-gray-700 max-h-[90vh] flex flex-col shadow-2xl overflow-hidden'>
        {/* Removed ternary check for showInviteConfirm. Always show form now. */}

        {/* MODAL HEADER */}
        <div className='flex justify-between items-center p-6 border-b border-gray-700/50'>
          <h2 className='text-2xl font-semibold text-white'>
            {t('userManagement.addModal.title')}
          </h2>
          <IoClose
            className='text-2xl cursor-pointer text-gray-400 hover:text-white transition-colors'
            onClick={onClose}
          />
        </div>

        {/* MODAL BODY */}
        <div className='p-6 space-y-5 overflow-y-auto custom-scrollbar'>
          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium text-gray-300 block mb-2'>
                {t('userManagement.addModal.fullName')}
              </label>
              <input
                type='text'
                placeholder={t('userManagement.addModal.fullNamePlaceholder')}
                value={formData.full_name}
                onChange={e =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className='w-full bg-[#1c1c24] border border-gray-700 rounded-lg py-3 px-4 text-white outline-none focus:border-blue-500'
              />
            </div>
            <div>
              <label className='text-sm font-medium text-gray-300 block mb-2'>
                {t('userManagement.addModal.email')}
              </label>
              <input
                type='email'
                placeholder={t('userManagement.addModal.emailPlaceholder')}
                value={formData.email}
                onChange={e =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className='w-full bg-[#1c1c24] border border-gray-700 rounded-lg py-3 px-4 text-white outline-none focus:border-blue-500'
              />
            </div>
            <div>
              {/* Password field hidden as per previous code context, but keeping struct */}
              <div className='relative'>
                {/* Input removed in previous snippet */}
              </div>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-300 block mb-2'>
                {t('userManagement.addModal.role')}
              </label>
              <div className='relative'>
                <select
                  value={formData.role}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      role: e.target.value,
                      meta: { assign_locations: [] }
                    })
                  }
                  className='w-full bg-[#1c1c24] appearance-none border border-gray-700 rounded-lg py-3 px-4 text-white outline-none cursor-pointer focus:border-blue-500'
                >
                  <option value='' disabled>
                    {t('userManagement.selectRole', 'Select a Role')}
                  </option>

                  {availableOptions.map(role => (
                    <option key={role} value={role}>
                      {t(`userManagement.roles.${role}`)}
                    </option>
                  ))}
                </select>
                <IoChevronDown className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none' />
              </div>
            </div>
          </div>

          {/* VIEWER SPECIFIC FIELDS */}
          {formData.role === 'viewer' && (
            <div className='space-y-5 pt-4 border-t border-gray-700/50 animate-in fade-in duration-300'>
              {/* <div className='w-full h-40 rounded-xl overflow-hidden border border-gray-700 bg-[#1c1c24]'>
                {isLoaded && (
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={defaultCenter}
                    zoom={3}
                    options={mapOptions}
                  >
                    {locations.map(l => {
                      const isSelected =
                        formData.meta.assign_locations.includes(l.id.toString())
                      return (
                        <Marker
                          key={l.id}
                          position={{
                            lat: parseFloat(l.lat),
                            lng: parseFloat(l.lang)
                          }}
                          onClick={() => handleLocationToggle(l.id)}
                          icon={{
                            url: isSelected
                              ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                              : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                          }}
                        />
                      )
                    })}
                  </GoogleMap>
                )}
              </div> */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-300 block'>
                  {t('userManagement.addModal.selectLocation')}
                  <span className='text-red-500 ml-1'>*</span>
                </label>
                <div className='relative'>
                  <select
                    onChange={e => handleLocationToggle(e.target.value)}
                    value='default'
                    className='w-full bg-[#1c1c24] appearance-none border border-gray-700 rounded-lg py-3 px-4 text-gray-300 outline-none cursor-pointer focus:border-blue-500 transition-all text-sm'
                  >
                    <option value='default' disabled>
                      {t('userManagement.addModal.searchLocation')}
                    </option>
                    {locations.map(l => (
                      <option
                        key={l.id}
                        value={l.id}
                        disabled={formData.meta.assign_locations.includes(
                          l.id.toString()
                        )}
                      >
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <IoChevronDown className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none' />
                </div>
              </div>

              {/* CHIPS */}
              <div className='bg-[#1c1c24] p-3 rounded-xl border border-gray-700'>
                <p className='text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-wider'>
                  {t('userManagement.addModal.assignedCount', {
                    count: formData.meta.assign_locations.length
                  })}
                </p>
                <div className='flex flex-wrap gap-2'>
                  {formData.meta.assign_locations.length > 0 ? (
                    formData.meta.assign_locations.map(locId => {
                      const locationObj = locations.find(
                        l => l.id.toString() === locId.toString()
                      )
                      return (
                        <span
                          key={locId}
                          className='bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs flex items-center gap-2'
                        >
                          <IoLocationOutline size={12} />
                          {locationObj ? locationObj.name : locId}
                          <IoClose
                            className='cursor-pointer hover:text-white'
                            onClick={() => handleLocationToggle(locId)}
                          />
                        </span>
                      )
                    })
                  ) : (
                    <p className='text-xs text-gray-600 italic'>
                      {t('userManagement.addModal.noLocations')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className='p-6 border-t border-gray-700/50 flex gap-3 bg-[#2c2d3a]'>
          <button
            className='flex-1 py-3 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700 transition-all'
            onClick={onClose}
          >
            {t('userManagement.addModal.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCreating}
            className='flex-1 py-3 rounded-xl bg-[#3b82f6] text-white font-bold hover:bg-blue-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2'
          >
            {isCreating
              ? t('userManagement.addModal.adding')
              : t('userManagement.addModal.addUser')}
            {!isCreating && <IoChevronForward />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddUserModal

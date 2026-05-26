import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { getLocations } from '../../../features/locations/locationApiSlice'
import { addNewUser, inviteUser } from '../../../features/userManagement/userApiSlice'
import generateRandomPassword from '../../../utils/generatePassword'
import { colors, bgcolors, borderstyles, buttons, gradients, shadows } from '../../../theme'
import { CloseIcon, ChevronDownIcon, MapPinIcon, ChevronRightIcon } from '../../../icons'

const FieldLabel = ({ text }) => {
  if (text?.endsWith('*')) {
    return <>{text.slice(0, -1)}<span style={{ color: colors.danger }}>*</span></>
  }
  return <>{text}</>
}

const AddUserModal = ({ isOpen, onClose, tenantId }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { isLoading: isCreating } = useSelector(state => state.users)
  const { locations = [] } = useSelector(state => state.locationApi)

  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [roleDropdownCoords, setRoleDropdownCoords] = useState({ top: 0, left: 0, width: 0 })
  const roleTriggerRef = useRef(null)

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
      case 'superadmin': return ['admin', 'operator', 'viewer']
      case 'admin':      return ['admin', 'operator', 'viewer']
      case 'operator':   return ['operator', 'viewer']
      case 'viewer':     return []
      default:           return []
    }
  }

  const availableOptions = getAvailableRoles(currentUserRole)

  useEffect(() => {
    if (tenantId && isOpen) dispatch(getLocations({ tenantId }))
  }, [tenantId, isOpen, dispatch])

  useEffect(() => {
    if (!isRoleOpen) return
    if (roleTriggerRef.current) {
      const rect = roleTriggerRef.current.getBoundingClientRect()
      setRoleDropdownCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }
    const handler = () => setIsRoleOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [isRoleOpen])

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
      return toast.error('Please select at least one location for viewer.')
    }
    try {
      const res = await dispatch(addNewUser({ tenant_id: tenantId, ...formData })).unwrap()
      console.log(res)
      try {
        await dispatch(
          inviteUser({
            tenant_id: tenantId,
            email: formData.email,
            redirect_url: window.location.origin + '/accept-invitation'
          })
        ).unwrap()
        toast.success(t('userManagement.toast.inviteSuccess') || 'User added and invitation sent!')
      } catch (inviteErr) {
        console.error(inviteErr)
        toast.warning('User added, but failed to send invitation email automatically.')
      }
      window.dispatchEvent(new CustomEvent('triggeruserapi', { detail: true }))
      onClose()
    } catch (err) {
      console.log(err)
      toast.error(err.message || t('userManagement.errors.addFailed'))
    }
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-[90] flex items-center justify-center ${bgcolors.overlay} backdrop-blur-sm p-4`}>
      <div
        className='w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]'
        style={{ backgroundColor: colors.panel, border: `1px solid ${colors.border}` }}
      >
        {/* Top accent bar */}
        <div className='h-1 w-full' style={{ background: gradients.accent }} />

        {/* HEADER */}
        <div
          className='flex justify-between items-center px-6 py-5'
          style={{ borderBottom: `1px solid ${colors.border}` }}
        >
          <h2 className='text-lg font-bold' style={{ color: colors.text }}>
            {t('userManagement.addModal.title')}
          </h2>
          <button
            onClick={onClose}
            className='w-8 h-8 flex items-center justify-center rounded-lg transition-colors'
            style={{ color: colors.textDim }}
            onMouseEnter={e => { e.currentTarget.style.color = colors.text; e.currentTarget.style.backgroundColor = colors.bg2 }}
            onMouseLeave={e => { e.currentTarget.style.color = colors.textDim; e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className='px-6 py-5 space-y-4 overflow-y-auto flex-1'>

          {/* Full Name */}
          <div>
            <label className='block text-sm font-semibold mb-1.5' style={{ color: colors.text }}>
              <FieldLabel text={t('userManagement.addModal.fullName')} />
            </label>
            <input
              type='text'
              placeholder={t('userManagement.addModal.fullNamePlaceholder')}
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              className='w-full rounded-xl py-2.5 px-4 text-sm outline-none transition-all'
              style={{
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
              onFocus={e => e.currentTarget.style.borderColor = colors.primary}
              onBlur={e => e.currentTarget.style.borderColor = colors.border}
            />
          </div>

          {/* Email */}
          <div>
            <label className='block text-sm font-semibold mb-1.5' style={{ color: colors.text }}>
              <FieldLabel text={t('userManagement.addModal.email')} />
            </label>
            <input
              type='email'
              placeholder={t('userManagement.addModal.emailPlaceholder')}
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className='w-full rounded-xl py-2.5 px-4 text-sm outline-none transition-all'
              style={{
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
              onFocus={e => e.currentTarget.style.borderColor = colors.primary}
              onBlur={e => e.currentTarget.style.borderColor = colors.border}
            />
          </div>

          {/* Role */}
          <div>
            <label className='block text-sm font-semibold mb-1.5' style={{ color: colors.text }}>
              <FieldLabel text={t('userManagement.addModal.role')} />
            </label>
            <div className='relative'>
              {/* Trigger */}
              <div
                ref={roleTriggerRef}
                onClick={(e) => { e.stopPropagation(); setIsRoleOpen(prev => !prev) }}
                className='w-full rounded-xl py-2.5 px-4 text-sm cursor-pointer flex items-center justify-between select-none'
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${isRoleOpen ? colors.primary : colors.border}`,
                  color: formData.role ? colors.text : colors.textMute,
                }}
              >
                <span>
                  {formData.role
                    ? t(`userManagement.roles.${formData.role}`)
                    : t('userManagement.selectRole', 'Select a Role')}
                </span>
                <span style={{ display: 'inline-flex', transition: 'transform 0.2s', transform: isRoleOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <ChevronDownIcon size={16} color={colors.textDim} />
                </span>
              </div>

              {/* Options panel — portalled to body so it doesn't cause modal scroll */}
              {isRoleOpen && ReactDOM.createPortal(
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'fixed',
                    top: roleDropdownCoords.top,
                    left: roleDropdownCoords.left,
                    width: roleDropdownCoords.width,
                    backgroundColor: colors.panel,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                    boxShadow: shadows.dropdown,
                    zIndex: 9999,
                    overflow: 'hidden',
                  }}
                >
                  {availableOptions.map(role => (
                    <div
                      key={role}
                      onClick={() => {
                        setFormData({ ...formData, role, meta: { assign_locations: [] } })
                        setIsRoleOpen(false)
                      }}
                      className='px-4 py-2.5 text-sm cursor-pointer transition-colors'
                      style={{
                        color: formData.role === role ? colors.primary : colors.text,
                        backgroundColor: formData.role === role ? colors.primaryLight : 'transparent',
                        fontWeight: formData.role === role ? 600 : 400,
                      }}
                      onMouseEnter={e => { if (formData.role !== role) e.currentTarget.style.backgroundColor = colors.bg2 }}
                      onMouseLeave={e => { if (formData.role !== role) e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      {t(`userManagement.roles.${role}`)}
                    </div>
                  ))}
                </div>,
                document.body
              )}
            </div>
          </div>

          {/* Viewer location selector */}
          {formData.role === 'viewer' && (
            <div className='space-y-3 pt-3' style={{ borderTop: `1px solid ${colors.border}` }}>
              <div>
                <label className='block text-sm font-semibold mb-1.5' style={{ color: colors.text }}>
                  {t('userManagement.addModal.selectLocation')}
                    </label>
                <div className='relative'>
                  <select
                    onChange={e => handleLocationToggle(e.target.value)}
                    value='default'
                    className='w-full appearance-none rounded-xl py-2.5 px-4 text-sm outline-none cursor-pointer transition-all'
                    style={{
                      backgroundColor: colors.bg,
                      border: `1px solid ${colors.border}`,
                      color: colors.textDim,
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = colors.primary}
                    onBlur={e => e.currentTarget.style.borderColor = colors.border}
                  >
                    <option value='default' disabled>
                      {t('userManagement.addModal.searchLocation')}
                    </option>
                    {locations.map(l => (
                      <option
                        key={l.id}
                        value={l.id}
                        disabled={formData.meta.assign_locations.includes(l.id.toString())}
                      >
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    size={16}
                    className='absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none'
                    color={colors.textDim}
                  />
                </div>
              </div>

              {/* Location chips */}
              <div className='rounded-xl p-3' style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
                <p className='text-[10px] font-bold uppercase tracking-wider mb-2' style={{ color: colors.textMute }}>
                  {t('userManagement.addModal.assignedCount', { count: formData.meta.assign_locations.length })}
                </p>
                <div className='flex flex-wrap gap-2'>
                  {formData.meta.assign_locations.length > 0 ? (
                    formData.meta.assign_locations.map(locId => {
                      const locationObj = locations.find(l => l.id.toString() === locId.toString())
                      return (
                        <span
                          key={locId}
                          className='flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium'
                          style={{ backgroundColor: colors.priorityLowBg, color: colors.primary, border: `1px solid ${colors.accentBorderLight}` }}
                        >
                          <MapPinIcon size={12} />
                          {locationObj ? locationObj.name : locId}
                          <CloseIcon
                            size={12}
                            className='cursor-pointer ml-1'
                            onClick={() => handleLocationToggle(locId)}
                          />
                        </span>
                      )
                    })
                  ) : (
                    <p className='text-xs italic' style={{ color: colors.textMute }}>
                      {t('userManagement.addModal.noLocations')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          className='px-6 py-4 flex justify-end gap-3'
          style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: colors.panel }}
        >
          <button
            onClick={onClose}
            className='px-5 py-2.5 rounded-xl text-sm font-medium transition-colors'
            style={{ backgroundColor: colors.bg2, color: colors.textDim, border: `1px solid ${colors.border}` }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = colors.border}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = colors.bg2}
          >
            {t('userManagement.addModal.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCreating}
            className={`${buttons.primary} px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50`}
          >
            {isCreating ? t('userManagement.addModal.adding') : t('userManagement.addModal.addUser')}
            {!isCreating && <ChevronRightIcon size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddUserModal

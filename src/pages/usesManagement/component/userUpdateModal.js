import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { getLocations } from '../../../features/locations/locationApiSlice'
import { updateTenantUser } from '../../../features/userManagement/userApiSlice'
import { colors, bgcolors, buttons, gradients, shadows } from '../../../theme'
import { CloseIcon, ChevronDownIcon, MapPinIcon, ChevronRightIcon } from '../../../icons'

const FieldLabel = ({ text }) => {
  if (text?.endsWith('*')) {
    return <>{text.slice(0, -1)}<span style={{ color: colors.danger }}>*</span></>
  }
  return <>{text}</>
}

const UpdateUserModal = ({ isOpen, onClose, tenantId, userData }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { isLoading: isUpdating } = useSelector(state => state.users)
  const { locations = [] } = useSelector(state => state.locations || state.locationApi || {})

  const [formData, setFormData] = useState({
    full_name: '',
    role: '',
    status: '',
    meta: { assign_locations: [] }
  })

  const [wasInvited, setWasInvited] = useState(false)

  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [roleCoords, setRoleCoords] = useState({ top: 0, left: 0, width: 0 })
  const roleTriggerRef = useRef(null)

  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [statusCoords, setStatusCoords] = useState({ top: 0, left: 0, width: 0 })
  const statusTriggerRef = useRef(null)

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
    if (userData) {
      const isInviteType =
        userData.status === 'invite' ||
        userData.meta?.never_accepted === true ||
        (userData.status === 'inactive' && !userData.meta?.was_active)
      setWasInvited(isInviteType)
      setFormData({
        full_name: userData.full_name || '',
        role: userData.role || 'viewer',
        status: userData.status || 'active',
        meta: { ...userData.meta, assign_locations: userData.meta?.assign_locations || [] }
      })
    }
  }, [userData])

  useEffect(() => {
    if (isOpen && tenantId) dispatch(getLocations({ tenantId }))
  }, [isOpen, tenantId, dispatch])

  useEffect(() => {
    if (!isRoleOpen) return
    if (roleTriggerRef.current) {
      const r = roleTriggerRef.current.getBoundingClientRect()
      setRoleCoords({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    const h = () => setIsRoleOpen(false)
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [isRoleOpen])

  useEffect(() => {
    if (!isStatusOpen) return
    if (statusTriggerRef.current) {
      const r = statusTriggerRef.current.getBoundingClientRect()
      setStatusCoords({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    const h = () => setIsStatusOpen(false)
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [isStatusOpen])

  const handleChange = e => {
    const { name, value } = e.target
    if (name === 'role' && value !== 'viewer') {
      setFormData(prev => ({ ...prev, [name]: value, meta: { ...prev.meta, assign_locations: [] } }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

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
    const sanitizedStatus = wasInvited && formData.status === 'active' ? 'invite' : formData.status
    if (wasInvited && formData.status === 'active') {
      toast.warning(t('userManagement.updateModal.cannotActivateInvite') || 'Cannot set an uninvited user to active.')
      return
    }
    try {
      await dispatch(
        updateTenantUser({ tenant_id: tenantId, user_id: userData.id, ...formData, status: sanitizedStatus })
      ).unwrap()
      toast.success(t('userManagement.updateModal.successToast'))
      onClose()
    } catch (err) {
      toast.error(err || t('userManagement.updateModal.errorToast'))
    }
  }

  const getLocationName = id => {
    const loc = locations.find(l => String(l.id) === String(id))
    return loc ? loc.name : id
  }

  const inputStyle = {
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    color: colors.text,
  }

  const handleFocus = e => e.currentTarget.style.borderColor = colors.primary
  const handleBlur  = e => e.currentTarget.style.borderColor = colors.border

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${bgcolors.overlay} backdrop-blur-sm p-4`}>
      <div
        className='w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]'
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
            {t('userManagement.updateModal.title')}
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
              <FieldLabel text={t('userManagement.updateModal.fullName')} />
            </label>
            <input
              type='text'
              name='full_name'
              value={formData.full_name}
              onChange={handleChange}
              className='w-full rounded-xl py-2.5 px-4 text-sm outline-none transition-all'
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          {/* Role + Status */}
          <div className='grid grid-cols-2 gap-4'>
            {/* Role */}
            <div>
              <label className='block text-sm font-semibold mb-1.5' style={{ color: colors.text }}>
                <FieldLabel text={t('userManagement.updateModal.role')} />
              </label>
              <div
                ref={roleTriggerRef}
                onClick={(e) => { e.stopPropagation(); setIsRoleOpen(p => !p) }}
                className='w-full rounded-xl py-2.5 px-4 text-sm cursor-pointer flex items-center justify-between select-none'
                style={{ ...inputStyle, border: `1px solid ${isRoleOpen ? colors.primary : colors.border}` }}
              >
                <span>{formData.role ? t(`userManagement.roles.${formData.role}`) : '—'}</span>
                <span style={{ display: 'inline-flex', transition: 'transform 0.2s', transform: isRoleOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <ChevronDownIcon size={16} color={colors.textDim} />
                </span>
              </div>
              {isRoleOpen && ReactDOM.createPortal(
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ position: 'fixed', top: roleCoords.top, left: roleCoords.left, width: roleCoords.width, backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, boxShadow: shadows.dropdown, zIndex: 9999, overflow: 'hidden' }}
                >
                  {availableOptions.map(role => (
                    <div
                      key={role}
                      onClick={() => { setFormData(prev => ({ ...prev, role, meta: { ...prev.meta, assign_locations: role !== 'viewer' ? [] : prev.meta.assign_locations } })); setIsRoleOpen(false) }}
                      className='px-4 py-2.5 text-sm cursor-pointer'
                      style={{ color: formData.role === role ? colors.primary : colors.text, backgroundColor: formData.role === role ? colors.primaryLight : 'transparent', fontWeight: formData.role === role ? 600 : 400 }}
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

            {/* Status */}
            <div>
              <label className='block text-sm font-semibold mb-1.5' style={{ color: colors.text }}>
                <FieldLabel text={t('userManagement.updateModal.status')} />
              </label>
              {(() => {
                const statusOptions = wasInvited
                  ? [
                      { value: 'invite', label: t('userManagement.updateModal.invited') || 'Invited (Pending)', disabled: false },
                      { value: 'inactive', label: t('userManagement.updateModal.inactive'), disabled: false },
                      { value: 'active', label: `${t('userManagement.updateModal.active')} (Pending Invite)`, disabled: true },
                    ]
                  : [
                      { value: 'active', label: t('userManagement.updateModal.active'), disabled: false },
                      { value: 'inactive', label: t('userManagement.updateModal.inactive'), disabled: false },
                    ]
                return (
                  <>
                    <div
                      ref={statusTriggerRef}
                      onClick={(e) => { e.stopPropagation(); setIsStatusOpen(p => !p) }}
                      className='w-full rounded-xl py-2.5 px-4 text-sm cursor-pointer flex items-center justify-between select-none'
                      style={{ ...inputStyle, border: `1px solid ${isStatusOpen ? colors.primary : colors.border}` }}
                    >
                      <span>{statusOptions.find(o => o.value === formData.status)?.label || formData.status}</span>
                      <span style={{ display: 'inline-flex', transition: 'transform 0.2s', transform: isStatusOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <ChevronDownIcon size={16} color={colors.textDim} />
                      </span>
                    </div>
                    {isStatusOpen && ReactDOM.createPortal(
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: 'fixed', top: statusCoords.top, left: statusCoords.left, width: statusCoords.width, backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, boxShadow: shadows.dropdown, zIndex: 9999, overflow: 'hidden' }}
                      >
                        {statusOptions.map(opt => (
                          <div
                            key={opt.value}
                            onClick={() => { if (!opt.disabled) { setFormData(prev => ({ ...prev, status: opt.value })); setIsStatusOpen(false) } }}
                            className='px-4 py-2.5 text-sm'
                            style={{ color: opt.disabled ? colors.textMute : formData.status === opt.value ? colors.primary : colors.text, backgroundColor: formData.status === opt.value ? colors.primaryLight : 'transparent', fontWeight: formData.status === opt.value ? 600 : 400, cursor: opt.disabled ? 'not-allowed' : 'pointer', opacity: opt.disabled ? 0.5 : 1 }}
                            onMouseEnter={e => { if (!opt.disabled && formData.status !== opt.value) e.currentTarget.style.backgroundColor = colors.bg2 }}
                            onMouseLeave={e => { if (!opt.disabled && formData.status !== opt.value) e.currentTarget.style.backgroundColor = 'transparent' }}
                          >
                            {opt.label}
                          </div>
                        ))}
                      </div>,
                      document.body
                    )}
                    {wasInvited && (
                      <p className='text-[11px] mt-1.5 flex items-center gap-1' style={{ color: colors.warningDark }}>
                        <span>⚠</span> User has not accepted the invitation yet.
                      </p>
                    )}
                  </>
                )
              })()}
            </div>
          </div>

          {/* Viewer location section */}
          {formData.role === 'viewer' && (
            <div className='space-y-3 pt-3' style={{ borderTop: `1px solid ${colors.border}` }}>
              <div>
                <label className='block text-sm font-semibold mb-1.5' style={{ color: colors.text }}>
                  {t('userManagement.updateModal.selectLocation')}
                </label>
                <div className='relative'>
                  <select
                    onChange={e => handleLocationToggle(e.target.value)}
                    value='default'
                    className='w-full appearance-none rounded-xl py-2.5 px-4 text-sm outline-none cursor-pointer transition-all'
                    style={{ ...inputStyle, color: colors.textDim }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  >
                    <option value='default' disabled>{t('userManagement.updateModal.searchLocation')}</option>
                    {locations.map(loc => {
                      const isSelected = formData.meta.assign_locations.some(id => String(id) === String(loc.id))
                      return (
                        <option key={loc.id} value={loc.id} disabled={isSelected}>
                          {loc.name}{isSelected ? ' (Selected)' : ''}
                        </option>
                      )
                    })}
                  </select>
                  <ChevronDownIcon size={16} className='absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none' color={colors.textDim} />
                </div>
              </div>

              {/* Location chips */}
              <div className='rounded-xl p-3' style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
                <p className='text-[10px] font-bold uppercase tracking-wider mb-2' style={{ color: colors.textMute }}>
                  {t('userManagement.updateModal.assignedCount', { count: formData.meta.assign_locations.length })}
                </p>
                <div className='flex flex-wrap gap-2'>
                  {formData.meta.assign_locations.length > 0 ? (
                    formData.meta.assign_locations.map(locId => (
                      <span
                        key={locId}
                        className='flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium'
                        style={{ backgroundColor: colors.priorityLowBg, color: colors.primary, border: `1px solid ${colors.accentBorderLight}` }}
                      >
                        <MapPinIcon size={12} />
                        {getLocationName(locId)}
                        <CloseIcon size={12} className='cursor-pointer ml-1' onClick={() => handleLocationToggle(locId)} />
                      </span>
                    ))
                  ) : (
                    <p className='text-xs italic' style={{ color: colors.textMute }}>
                      {t('userManagement.updateModal.noLocations')}
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
            {t('userManagement.updateModal.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUpdating}
            className={`${buttons.primary} px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50`}
          >
            {isUpdating ? t('userManagement.updateModal.updating') : t('userManagement.updateModal.updateUser')}
            {!isUpdating && <ChevronRightIcon size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpdateUserModal

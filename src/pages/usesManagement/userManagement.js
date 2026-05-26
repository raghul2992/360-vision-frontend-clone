import React, { useState, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'

import {
  AddUserIcon,
  EditIcon,
  TrashIcon,
  AlertCircleIcon,
  MailOpenIcon,
  SearchIcon,
  ChevronDownIcon,
  InfoIcon,
  LockIcon,
} from '../../icons'
import { bgcolors, textcolors, textSizes, borderstyles, colors, kpiAccents, buttons } from '../../theme'

import AddUserModal from './component/userAddModal'
import UpdateUserModal from './component/userUpdateModal'
import SendInvitationConfirm from './component/SendInvitationConfirm'

import {
  fetchTenantsUsers,
  deleteTenantUser,
  updateTenantUser,
  inviteUser
} from '../../features/userManagement/userApiSlice'

import { getLocations } from '../../features/locations/locationApiSlice'

const UserManagement = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const tenantId = localStorage.getItem('tenant_id')

  /* ---------------- AUTH / PERMISSIONS ---------------- */
  // Access the logged-in user's info to check permissions
  const { user: currentUser } = useSelector(state => state.auth)
  const currentUserRole = currentUser?.role?.toLowerCase()

  /* ---------------- FILTER STATES ---------------- */
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  /* ---------------- MODAL STATES ---------------- */
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [updateModal, setUpdateModal] = useState({ isOpen: false, user: null })
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    userId: null
  })
  const [inviteModal, setInviteModal] = useState({ isOpen: false, user: null })

  const { users, isLoading, isInviting } = useSelector(state => state.users)
  const { locations = [] } = useSelector(state => state.locationApi)

  useEffect(() => {
    const handleRefresh = () => {
      setRefreshTrigger(prev => prev + 1)
    }
    window.addEventListener('triggeruserapi', handleRefresh)
    return () => {
      window.removeEventListener('triggeruserapi', handleRefresh)
    }
  }, [])

  /* Close role dropdown on outside click */
  useEffect(() => {
    if (!isRoleDropdownOpen) return
    const handler = () => setIsRoleDropdownOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [isRoleDropdownOpen])

  /* ---------------- FETCH USERS ---------------- */
  useEffect(() => {
    if (tenantId) {
      dispatch(fetchTenantsUsers({ tenant_id: tenantId, user_id: users }))
    }
    dispatch(getLocations({ tenantId }))
  }, [dispatch, tenantId, refreshTrigger])

  /* ---------------- FILTER LOGIC ---------------- */
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRole =
        roleFilter === 'all' ||
        user.role.toLowerCase() === roleFilter.toLowerCase()

      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, roleFilter])

  /* ---------------- HANDLERS ---------------- */
  const confirmDelete = async () => {
    try {
      await dispatch(
        deleteTenantUser({ tenant_id: tenantId, user_id: deleteModal.userId })
      ).unwrap()
      toast.success(t('userManagement.toast.deleteSuccess'))
      setDeleteModal({ isOpen: false, userId: null })
    } catch (err) {
      toast.error(err || 'Failed to delete')
    }
  }

  const handleSendInvitation = async () => {
    try {
      await dispatch(
        inviteUser({
          tenant_id: tenantId,
          email: inviteModal.user.email,
          redirect_url: window.location.origin + '/accept-invitation'
        })
      ).unwrap()
      toast.success(t('userManagement.toast.inviteSuccess'))
      window.dispatchEvent(new CustomEvent('triggeruserapi', { detail: true }))
      setInviteModal({ isOpen: false, user: null })
    } catch (err) {
      toast.error(err || 'Failed to send invitation')
    }
  }

  const getLocationLabel = assignedIds => {
    if (!assignedIds || assignedIds.length === 0) return null
    const locationNames = assignedIds.map(id => {
      const foundLoc = locations?.find(loc => loc.id == id)
      return foundLoc ? foundLoc.name : id
    })
    return locationNames.join(', ')
  }

  const stats = useMemo(
    () => [
      {
        key: 'total',
        label: t('userManagement.stats.total'),
        value: users.length,
      },
      {
        key: 'active',
        label: t('userManagement.stats.active'),
        value: users.filter(u => u.status === 'active').length,
      },
      {
        key: 'admins',
        label: t('userManagement.stats.admins'),
        value: users.filter(u => u.role === 'admin').length,
        description: t('userManagement.roleInfo.admin')
      },
      {
        key: 'operator',
        label: t('userManagement.stats.operator'),
        value: users.filter(u => u.role === 'operator').length,
        description: t('userManagement.roleInfo.operator')
      },
      {
        key: 'viewers',
        label: t('userManagement.stats.viewers'),
        value: users.filter(u => u.role === 'viewer').length,
        description: t('userManagement.roleInfo.viewer')
      }
    ],
    [users, t]
  )

  const getRoleStyle = role =>
    role === 'admin'
      ? `${bgcolors.accentLight} ${textcolors.accentText} ${borderstyles.accentSoft}`
      : role === 'operator'
      ? `${bgcolors.purpleLight} ${textcolors.purpleDark} ${borderstyles.purpleBorder}`
      : `${bgcolors.grayLight} ${textcolors.dim} ${borderstyles.light}`

  return (
    <div className={`${bgcolors.surface} min-h-screen p-4 sm:p-6 lg:p-8 relative font-sans`}>
      {/* MODALS */}
      {isAddModalOpen && (
        <AddUserModal
          isOpen
          tenantId={tenantId}
          onClose={() => {
            setIsAddModalOpen(false)
            window.dispatchEvent(
              new CustomEvent('triggeruserapi', { detail: true })
            )
          }}
        />
      )}
      {updateModal.isOpen && (
        <UpdateUserModal
          isOpen
          tenantId={tenantId}
          userData={updateModal.user}
          onClose={() => setUpdateModal({ isOpen: false, user: null })}
        />
      )}

      {inviteModal.isOpen && (
        <div className={`fixed inset-0 z-[110] flex items-center justify-center ${bgcolors.backdropMid} backdrop-blur-sm p-4`}>
          <div className={`${bgcolors.white} w-full max-w-md rounded-2xl ${borderstyles.light} shadow-2xl`}>
            <SendInvitationConfirm
              title={t('userManagement.modals.sendInvitation')}
              fullName={inviteModal.user.full_name}
              onSend={handleSendInvitation}
              onSkip={() => setInviteModal({ isOpen: false, user: null })}
              isInviting={isInviting}
              isExistingUser={true}
            />
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className={`fixed inset-0 z-[110] flex items-center justify-center ${bgcolors.overlay} backdrop-blur-sm p-4`}>
          <div className={`${bgcolors.white} ${textcolors.normaltext} w-full max-w-sm rounded-2xl p-6 ${borderstyles.light} shadow-2xl text-center`}>
            <div className='flex justify-center mb-4'>
              <AlertCircleIcon size={48} color={colors.danger} />
            </div>
            <h3 className={`text-xl font-bold mb-2 ${textcolors.normaltext}`}>
              {t('userManagement.modals.deleteTitle')}
            </h3>
            <p className={`${textcolors.dim} text-sm mb-6`}>
              {t('userManagement.modals.deleteText')}
            </p>
            <div className='flex gap-3'>
              <button
                onClick={() => setDeleteModal({ isOpen: false, userId: null })}
                className={`flex-1 py-2.5 rounded-xl ${buttons.secondary}`}
              >
                {t('userManagement.modals.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                className={`flex-1 py-2.5 rounded-xl ${buttons.danger}`}
              >
                {t('userManagement.modals.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className='flex flex-wrap justify-between items-start gap-3 mb-4'>
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${textcolors.normaltext}`}>
            {t('userManagement.title')}
          </h1>
          <p className={`${textSizes.subtitle} ${textcolors.dim} mt-1.5`}>
            {t('userManagement.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className={`${buttons.primary} px-4 py-2 text-sm rounded-full flex items-center gap-2 shrink-0`}
        >
          <AddUserIcon size={18} /> {t('userManagement.addUser')}
        </button>
      </div>

      {/* STATS SECTION */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4'>
        {stats.map((s, i) => (
          <div
            key={i}
            className={`relative ${bgcolors.white} p-5 pl-6 rounded-xl ${borderstyles.light} shadow-sm overflow-hidden hover-shake`}
          >
            {/* Colored left accent strip */}
            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${kpiAccents[s.key].accent}`} />

            <div className='flex items-center gap-2 mb-2'>
              <p className={`${textcolors.muted} text-[10px] uppercase font-bold tracking-wider`}>
                {s.label}
              </p>
              {s.description && (
                <div className='group relative cursor-default'>
                  <InfoIcon size={14} className={`${textcolors.muted} transition-colors`} />
                  <div className={`absolute left-0 top-6 hidden group-hover:block z-50 w-48 p-3 ${bgcolors.white} ${borderstyles.light} rounded-lg shadow-xl`}>
                    <div className={`absolute -top-1 left-1 w-2 h-2 ${bgcolors.white} border-t border-l transform rotate-45`} style={{ borderColor: colors.border }}></div>
                    <p className={`text-[10px] normal-case tracking-normal ${textcolors.bodyMedium} leading-relaxed`}>
                      {s.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <p className={`text-3xl font-extrabold ${kpiAccents[s.key].value}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className={`${bgcolors.white} mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 ${borderstyles.light} rounded-xl shadow-sm relative z-10`}>
        {/* Search input box */}
        <div className={`w-full sm:flex-1 flex items-center gap-2 px-3 py-2 ${bgcolors.surface} ${borderstyles.light} rounded-lg`}>
          <span className={textcolors.dim}>
            <SearchIcon size={16} />
          </span>
          <input
            type='text'
            placeholder={t('userManagement.searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`flex-1 bg-transparent ${textcolors.normaltext} ${textcolors.placeholder} border-none ${textSizes.subtitle} focus:ring-0 outline-none`}
          />
        </div>

        {/* All Roles custom dropdown */}
        <div className='relative w-full sm:w-[160px]'>
          <div
            className={`flex items-center justify-between gap-2 ${bgcolors.surface} ${borderstyles.light} rounded-lg py-2 pl-3 pr-3 cursor-pointer select-none ${textcolors.normaltext} ${textSizes.subtitle}`}
            onClick={(e) => { e.stopPropagation(); setIsRoleDropdownOpen(prev => !prev) }}
          >
            <span>
              {roleFilter === 'all' ? t('userManagement.allRoles')
                : roleFilter === 'admin' ? 'Admin'
                : roleFilter === 'operator' ? 'Operator'
                : 'Viewer'}
            </span>
            <span style={{ display: 'inline-flex', transition: 'transform 0.2s', transform: isRoleDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <ChevronDownIcon size={14} />
            </span>
          </div>
          {isRoleDropdownOpen && (
            <div
              className={`absolute z-20 top-full mt-1 w-full ${bgcolors.white} ${borderstyles.light} rounded-xl shadow-lg overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
            >
              {[
                { value: 'all', label: t('userManagement.allRoles') },
                { value: 'admin', label: 'Admin' },
                { value: 'operator', label: 'Operator' },
                { value: 'viewer', label: 'Viewer' },
              ].map(opt => (
                <div
                  key={opt.value}
                  className={`px-4 py-2.5 ${textSizes.subtitle} cursor-pointer transition-colors ${
                    roleFilter === opt.value
                      ? `${bgcolors.accentLight} ${textcolors.accentText} font-medium`
                      : `${textcolors.normaltext} ${bgcolors.accentHover} ${textcolors.accentHover}`
                  }`}
                  onClick={() => { setRoleFilter(opt.value); setIsRoleDropdownOpen(false) }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clear button */}
        <button
          onClick={() => {
            setSearchQuery('')
            setRoleFilter('all')
          }}
          className={`${buttons.primary} px-5 py-2 rounded-lg ${textSizes.subtitle} w-full sm:w-auto`}
        >
          {t('userManagement.clear')}
        </button>
      </div>

      {/* TABLE */}
      <div className={`${bgcolors.white} rounded-xl ${borderstyles.light} overflow-hidden shadow-sm overflow-x-auto`}>
        {isLoading ? (
          <div className={`p-20 text-center ${textcolors.muted} flex flex-col items-center gap-4`}>
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${borderstyles.primaryBorder}`}></div>
            {t('userManagement.loading')}
          </div>
        ) : (
          <table className='w-full min-w-[640px] text-left border-collapse'>
            <thead>
              <tr className={`${textcolors.dim} text-[11px] uppercase tracking-widest ${borderstyles.tableHeader} ${bgcolors.tableHeaderFaint}`}>
                <th className='px-5 py-4 font-semibold'>
                  {t('userManagement.table.user')}
                </th>
                <th className='px-5 py-4 font-semibold'>
                  <div className='flex items-center gap-1.5'>
                    {t('userManagement.table.role')}
                    <div className='group relative cursor-default'>
                      <InfoIcon size={16} className={`${textcolors.muted} transition-colors`} />
                      <div className={`absolute left-0 top-6 hidden group-hover:block z-50 w-64 p-3 ${bgcolors.white} ${borderstyles.light} rounded-lg shadow-xl text-[12px] normal-case tracking-normal`}>
                        <div className={`space-y-2 ${textcolors.bodyMedium}`}>
                          <p>
                            <strong className={textcolors.primary}>Admin:</strong>{' '}
                            {t('userManagement.roleInfo.admin')}
                          </p>
                          <p>
                            <strong className={textcolors.purple}>Operator:</strong>{' '}
                            {t('userManagement.roleInfo.operator')}
                          </p>
                          <p>
                            <strong className={textcolors.dim}>Viewer:</strong>{' '}
                            {t('userManagement.roleInfo.viewer')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </th>
                <th className='px-5 py-4 font-semibold'>
                  {t('userManagement.table.locations')}
                </th>
                <th className='px-5 py-4 font-semibold'>
                  {t('userManagement.table.status')}
                </th>
                <th className='px-5 py-4 text-right font-semibold'>
                  {t('userManagement.table.action')}
                </th>
              </tr>
            </thead>
            <tbody className={borderstyles.divider}>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(u => {
                  // --- PERMISSION CHECK ---
                  // If current user is Operator, they cannot edit/delete Admins
                  const isRestricted =
                    currentUserRole === 'operator' &&
                    u.role?.toLowerCase() === 'admin'

                  return (
                    <tr
                      key={u.id}
                      className='transition-colors duration-150 group cursor-default'
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = colors.priorityLowBg}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td className='px-5 py-4'>
                        <p className={`font-bold ${textcolors.normaltext} ${textSizes.subtitle}`}>
                          {u.full_name}
                        </p>
                        <p className={`text-xs ${textcolors.dim} mt-0.5`}>{u.email}</p>
                      </td>
                      <td className='px-5 py-4'>
                        <span
                          className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full ${getRoleStyle(u.role)}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className={`px-5 py-4 max-w-52 ${textSizes.subtitle} ${textcolors.dim}`}>
                        {getLocationLabel(u.meta?.assign_locations) ||
                          t('userManagement.table.global')}
                      </td>
                      <td className='px-5 py-4'>
                        <button
                          type='button'
                          className={`text-[10px] font-bold uppercase px-4 py-1.5 rounded-full transition-all ${
                            u.status === 'active'
                              ? `${bgcolors.successLight} ${textcolors.successDark} ${borderstyles.successBorder}`
                              : u.status === 'invite'
                              ? `${bgcolors.warningFaint} ${textcolors.warningText} ${borderstyles.warningBorder}`
                              : `${bgcolors.dangerFaint} ${textcolors.danger} ${borderstyles.dangerBorder}`
                          }`}
                        >
                          {u.status}
                        </button>
                      </td>
                      <td className='px-5 py-4'>
                        <div className={`flex justify-end gap-3 ${textcolors.dim}`}>
                          {u.status !== 'active' && !isRestricted && (
                            <button
                              type='button'
                              title={t('userManagement.modals.sendInvitation')}
                              onClick={() => setInviteModal({ isOpen: true, user: u })}
                              className='w-8 h-8 flex items-center justify-center rounded-lg transition-all'
                              style={{ color: colors.textMute }}
                              onMouseEnter={e => { e.currentTarget.style.color = colors.successDark; e.currentTarget.style.backgroundColor = colors.successFaintBg; }}
                              onMouseLeave={e => { e.currentTarget.style.color = colors.textMute; e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              <MailOpenIcon size={17} />
                            </button>
                          )}

                          {/* Render Actions only if not restricted */}
                          {!isRestricted ? (
                            <>
                              <button
                                type='button'
                                title='Edit'
                                onClick={() => setUpdateModal({ isOpen: true, user: u })}
                                className='w-8 h-8 flex items-center justify-center rounded-lg transition-all'
                                style={{ color: colors.textMute }}
                                onMouseEnter={e => { e.currentTarget.style.color = colors.primary; e.currentTarget.style.backgroundColor = colors.priorityLowBg; }}
                                onMouseLeave={e => { e.currentTarget.style.color = colors.textMute; e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <EditIcon size={17} />
                              </button>
                              <button
                                type='button'
                                title='Delete'
                                onClick={() => setDeleteModal({ isOpen: true, userId: u.id })}
                                className='w-8 h-8 flex items-center justify-center rounded-lg transition-all'
                                style={{ color: colors.textMute }}
                                onMouseEnter={e => { e.currentTarget.style.color = colors.danger; e.currentTarget.style.backgroundColor = colors.priorityHighBg; }}
                                onMouseLeave={e => { e.currentTarget.style.color = colors.textMute; e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <TrashIcon size={17} />
                              </button>
                            </>
                          ) : (
                            <div
                              title='Permission restricted'
                              className='w-8 h-8 flex items-center justify-center cursor-not-allowed opacity-30'
                            >
                              <LockIcon size={17} />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td
                    colSpan='5'
                    className={`p-10 text-center ${textcolors.muted} italic`}
                  >
                    {t('userManagement.noUsers')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default UserManagement

import React, { useState, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  IoPersonAddOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoAlertCircleOutline,
  IoMailOpenOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoChevronDownOutline,
  IoInformationCircleOutline,
  IoLockClosedOutline
} from 'react-icons/io5'
import { toast } from 'react-toastify'

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
import { bgcolors } from '../../theme'

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
        label: t('userManagement.stats.total'),
        value: users.length,
        color: 'text-yellow-500'
      },
      {
        label: t('userManagement.stats.active'),
        value: users.filter(u => u.status === 'active').length,
        color: 'text-green-500'
      },
      {
        label: t('userManagement.stats.admins'),
        value: users.filter(u => u.role === 'admin').length,
        color: 'text-blue-500',
        description: t('userManagement.roleInfo.admin')
      },
      {
        label: t('userManagement.stats.operator'),
        value: users.filter(u => u.role === 'operator').length,
        color: 'text-purple-500',
        description: t('userManagement.roleInfo.operator')
      },
      {
        label: t('userManagement.stats.viewers'),
        value: users.filter(u => u.role === 'viewer').length,
        color: 'text-gray-400',
        description: t('userManagement.roleInfo.viewer')
      }
    ],
    [users, t]
  )

  const getRoleStyle = role =>
    role === 'admin'
      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
      : role === 'operator'
      ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
      : 'bg-gray-600/20 text-gray-400 border border-gray-500/30'

  return (
    <div className={` ${bgcolors.white}  min-h-screen p-8 relative font-sans` }>
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
        <div className='fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4'>
          <div className='bg-[#2c2d3a] w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl'>
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
        <div className='fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
          <div className='bg-[#2c2d3a] text-white w-full max-w-sm rounded-2xl p-6 border border-gray-700 text-center'>
            <IoAlertCircleOutline className='text-red-500 text-5xl mx-auto mb-4' />
            <h3 className='text-xl font-bold mb-2 text-white '>
              {t('userManagement.modals.deleteTitle')}
            </h3>
            <p className='text-white text-sm mb-6'>
              {t('userManagement.modals.deleteText')}
            </p>
            <div className='flex gap-3'>
              <button
                onClick={() => setDeleteModal({ isOpen: false, userId: null })}
                className='flex-1 py-2.5 rounded-xl bg-gray-800'
              >
                {t('userManagement.modals.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                className='flex-1 py-2.5 rounded-xl bg-red-600 font-bold'
              >
                {t('userManagement.modals.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            {t('userManagement.title')}
          </h1>
          <p className='text-sm'>
            {t('userManagement.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className='bg-[#3885CC] text-white hover:bg-[#2d6da8] transition-colors px-6 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-lg shadow-blue-500/20'
        >
          <IoPersonAddOutline size={18} /> {t('userManagement.addUser')}
        </button>
      </div>

      {/* STATS SECTION */}
      <div className='grid grid-cols-5 gap-4 mb-8'>
        {stats.map((s, i) => (
          <div
            key={i}
            className='bg-[#2c2d3a] p-5 rounded-2xl border border-gray-800/50 shadow-sm'
          >
            <div className='flex items-center gap-2 mb-1'>
              <p className='text-gray-400 text-[10px] uppercase font-bold tracking-wider'>
                {s.label}
              </p>
              {s.description && (
                <div className='group relative cursor-help'>
                  <IoInformationCircleOutline
                    className='text-gray-500 hover:text-blue-400 transition-colors'
                    size={14}
                  />
                  <div className='absolute left-0 top-6 hidden group-hover:block z-50 w-48 p-3 bg-[#3a3b4a] border border-gray-700 rounded-lg shadow-2xl'>
                    <div className='absolute -top-1 left-1 w-2 h-2 bg-[#3a3b4a] border-t border-l border-gray-700 transform rotate-45'></div>
                    <p className='text-[10px] normal-case tracking-normal text-gray-200 leading-relaxed'>
                      {s.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className='bg-[#2c2d3a] p-4 rounded-xl mb-6 flex items-center gap-4 border border-gray-800/50 relative z-10'>
        <div className='relative flex-1'>
          <input
            type='text'
            placeholder={t('userManagement.searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='w-full bg-[#3a3b4a] border-none rounded-lg py-3 px-4 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-all'
          />
        </div>
        <div className='flex items-center gap-4'>
          {/* <IoFilterOutline className='text-gray-400' size={20} /> */}
          <div className='relative min-w-[160px]'>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className='w-full appearance-none bg-[#3a3b4a] text-white border-none rounded-lg py-3 px-4 text-sm focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer pr-10'
            >
              <option value='all'>{t('userManagement.allRoles')}</option>
              <option value='admin'>Admin</option>
              <option value='operator'>Operator</option>
              <option value='viewer'>Viewer</option>
            </select>
            <IoChevronDownOutline className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none' />
          </div>
          <button
            onClick={() => {
              setSearchQuery('')
              setRoleFilter('all')
            }}
            className='px-6 py-3 rounded-lg bg-[#3a3b4a] text-white hover:bg-gray-700 text-sm font-medium transition-colors'
          >
            {t('userManagement.clear')}
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className='bg-[#2c2d3a] rounded-2xl border border-gray-800/50 overflow-hidden shadow-xl'>
        {isLoading ? (
          <div className='p-20 text-center text-gray-500 flex flex-col items-center gap-4'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
            {t('userManagement.loading')}
          </div>
        ) : (
          <table className='w-full text-left border-collapse'>
            <thead>
              <tr className='text-gray-400 text-[11px] uppercase tracking-widest border-b border-gray-800/50'>
                <th className='p-5 font-semibold'>
                  {t('userManagement.table.user')}
                </th>
                <th className='p-5 font-semibold'>
                  <div className='flex items-center gap-1.5'>
                    {t('userManagement.table.role')}
                    <div className='group relative cursor-help'>
                      <IoInformationCircleOutline
                        className='text-gray-500 hover:text-blue-400 transition-colors'
                        size={16}
                      />
                      <div className='absolute left-0 top-6 hidden group-hover:block z-50 w-64 p-3 bg-[#3a3b4a] border border-gray-700 rounded-lg shadow-2xl text-[12px] normal-case tracking-normal'>
                        <div className='space-y-2 text-gray-200'>
                          <p>
                            <strong className='text-blue-400'>Admin:</strong>{' '}
                            {t('userManagement.roleInfo.admin')}
                          </p>
                          <p>
                            <strong className='text-purple-400'>
                              Operator:
                            </strong>{' '}
                            {t('userManagement.roleInfo.operator')}
                          </p>
                          <p>
                            <strong className='text-gray-400'>Viewer:</strong>{' '}
                            {t('userManagement.roleInfo.viewer')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </th>
                <th className='p-5 font-semibold'>
                  {t('userManagement.table.locations')}
                </th>
                <th className='p-5 font-semibold'>
                  {t('userManagement.table.status')}
                </th>
                <th className='p-5 text-center font-semibold'>
                  {t('userManagement.table.action')}
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-800/30'>
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
                      className='hover:bg-gray-800/30 transition-colors group'
                    >
                      <td className='p-5'>
                        <p className='font-semibold text-gray-200'>
                          {u.full_name}
                        </p>
                        <p className='text-xs text-gray-500'>{u.email}</p>
                      </td>
                      <td className='p-5'>
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded ${getRoleStyle(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className='p-5 max-w-52 text-xs text-gray-400'>
                        {getLocationLabel(u.meta?.assign_locations) ||
                          t('userManagement.table.global')}
                      </td>
                      <td className='p-5'>
                        <button
                          type='button'
                          className={`text-[10px] font-bold uppercase px-4 py-1.5 rounded-full transition-all border ${
                            u.status === 'active'
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : u.status === 'invite'
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {u.status}
                        </button>
                      </td>
                      <td className='p-5'>
                        <div className='flex justify-center gap-4 text-gray-400'>
                          {u.status !== 'active' && !isRestricted && (
                            <button
                              type='button'
                              title={t('userManagement.modals.sendInvitation')}
                              onClick={() =>
                                setInviteModal({ isOpen: true, user: u })
                              }
                              className='hover:text-green-400 transition-colors'
                            >
                              <IoMailOpenOutline size={20} />
                            </button>
                          )}

                          {/* Render Actions only if not restricted */}
                          {!isRestricted ? (
                            <>
                              <button
                                type='button'
                                title='Edit'
                                onClick={() =>
                                  setUpdateModal({ isOpen: true, user: u })
                                }
                                className='hover:text-blue-400 transition-colors'
                              >
                                <IoPencilOutline size={20} />
                              </button>
                              <button
                                type='button'
                                title='Delete'
                                onClick={() =>
                                  setDeleteModal({ isOpen: true, userId: u.id })
                                }
                                className='hover:text-red-500 transition-colors'
                              >
                                <IoTrashOutline size={20} />
                              </button>
                            </>
                          ) : (
                            <div
                              title='Permission restricted'
                              className='cursor-not-allowed opacity-30'
                            >
                              <IoLockClosedOutline size={20} />
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
                    className='p-10 text-center text-gray-500 italic'
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

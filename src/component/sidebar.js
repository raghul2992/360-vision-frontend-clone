import React, { useEffect } from 'react'
import company_logo from '../assets/company-icon.png'
import {
  IoHomeOutline,
  IoLocationOutline,
  IoCameraOutline,
  IoSettingsOutline,
  IoLogOutOutline,
  IoPeopleOutline
} from 'react-icons/io5'
import { textcolors, bgcolors } from '../theme'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logoutUser } from '../features/auth/authSlice'

const Sidebar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  // 1. Retrieve the role directly
  const userRole = localStorage.getItem('user_role')

  const handleLogout = async () => {
    try {
      const result = await dispatch(logoutUser()).unwrap()
      console.log('Logout success:', result)
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const isActive = path =>
    location.pathname === path
      ? 'rounded-[16px] active-menu'
      : ''

  useEffect(() => {
    console.log('Current Role:', userRole)
  }, [userRole])

  return (
    <div className={`sticky w-[90px] h-screen flex flex-col items-center py-3`}>
      <div className='flex justify-center items-center mb-4'>
        <img src={company_logo} alt='logo' className='w-10 h-10' />
      </div>

      <div className='flex flex-col items-center justify-center flex-1 gap-5 text-xl'>
        {/* Dashboard - Visible to everyone */}
        <Link to='/dashboard'>
          <div className={`menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px] ${isActive('/dashboard')}`}>
            <IoHomeOutline className={`text-2xl`} />
          </div>
        </Link>

        {/* Location - Visible to everyone */}
        <Link to='/location'>
          <div className={`menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px] ${isActive('/location')}`}>
            <IoLocationOutline
              className={`text-2xl`}
            />
          </div>
        </Link>

        {/* Camera - HIDDEN for viewer */}
        {userRole !== 'viewer' && (
          <Link to='/camera'>
            <div className={`menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px] ${isActive('/camera')}`}>
              <IoCameraOutline className={`text-2xl`} />
            </div>
          </Link>
        )}

        {/* People/User Mgmt - HIDDEN for viewer */}
        {userRole !== 'viewer' && (
          <Link to='/user-management'>
            <div className={`menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px] ${isActive('/user-management')}`}>
              <IoPeopleOutline
                className={`text-2xl`}
              />
            </div>
          </Link>
        )}
      </div>

      {/* Logout */}
        <div className={`menu-item w-12 h-12 flex justify-center items-center cursor-pointer hover:rounded-[16px]`}>
        <IoLogOutOutline
          className={`text-2xl`}
          onClick={handleLogout}
        />
      </div>
    </div>
  )
}

export default Sidebar

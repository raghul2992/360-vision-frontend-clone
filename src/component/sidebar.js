import React from 'react'
import ssticon from '../assets/sst-icon.png'
import {
  IoHome,
  IoLocationOutline,
  IoStatsChart,
  IoCameraOutline,
  IoSettingsOutline,
  IoLogOutOutline
} from 'react-icons/io5'
import { textcolors } from '../theme'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logoutUser } from '../features/auth/authSlice'

const Sidebar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      const result = await dispatch(logoutUser()).unwrap()
      console.log('Logout success:', result)
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Utility function → check if route is active
  const isActive = path =>
    location.pathname === path
      ? 'bg-[#30313F] rounded-[16px] text-[#3885CC]'
      : `${textcolors.white}`

  return (
    <div className='sticky w-[90px] h-screen bg-[#1c1c24] flex flex-col items-center py-3'>
      <div className='flex justify-center items-center mb-4'>
        <img src={ssticon} alt='logo' className='w-10 h-10' />
      </div>

      <div className='flex flex-col items-center justify-center flex-1 gap-5 text-xl'>
        {/* Dashboard */}
        <Link to='/dashboard'>
          <div className='w-12 h-12 flex justify-center items-center cursor-pointer hover:bg-[#30313F] hover:rounded-[16px]'>
            <IoHome className={`text-2xl ${isActive('/dashboard')}`} />
          </div>
        </Link>

        {/* Location */}
        <Link to='/location'>
          <div className='w-12 h-12 flex justify-center items-center cursor-pointer hover:bg-[#30313F] hover:rounded-[16px]'>
            <IoLocationOutline
              className={`text-2xl ${isActive('/location')}`}
            />
          </div>
        </Link>

        {/* Camera */}
        <Link to='/camera'>
          <div className='w-12 h-12 flex justify-center items-center cursor-pointer hover:bg-[#30313F] hover:rounded-[16px]'>
            <IoCameraOutline className={`text-2xl ${isActive('/camera')}`} />
          </div>
        </Link>

        {/* Settings
        <Link to='/settings'>
          <div className='w-12 h-12 flex justify-center items-center cursor-pointer hover:bg-[#30313F] hover:rounded-[16px]'>
            <IoSettingsOutline
              className={`text-2xl ${isActive('/settings')}`}
            />
          </div>
        </Link> */}
      </div>

      {/* Logout */}
      <div className='flex justify-center items-center mt-4 text-2xl'>
        <IoLogOutOutline
          className={`${textcolors.white} rotate-180 cursor-pointer`}
          onClick={handleLogout}
        />
      </div>
    </div>
  )
}

export default Sidebar

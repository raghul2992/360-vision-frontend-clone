import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  IoBusinessOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoMailOutline,
  IoLockClosed,
  IoClose
} from 'react-icons/io5'
import { bgcolors, fontWeights, textcolors, textSizes } from '../theme'
import Label from './Label'
import TextInput from './TextInput'
import PasswordInput from './PasswordInput'
import ButtonComponent from './Button'
import { createTenant } from '../features/admin/adminSlice'
import { toast } from 'react-toastify'

const AddTenantModal = ({ onClose, onSuccess }) => {
  const dispatch = useDispatch()
  const { updateLoading } = useSelector(state => state.admin)

  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    const { companyName, address, fullName, email, password, confirmPassword } = formData

    if (!companyName || !address || !fullName || !email || !password || !confirmPassword) {
      toast.error('All fields are required')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    try {
      await dispatch(
        createTenant({
          name: companyName,
          address,
          admin_user: {
            full_name: fullName,
            email,
            role: 'admin',
            meta: { assign_locations: [] },
            password
          }
        })
      ).unwrap()

      toast.success('Tenant created successfully')
      onSuccess?.()
      onClose()
    } catch (error) {
      toast.error(error || 'Failed to create tenant')
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
      <div className='bg-[#1c1c24] border border-gray-700/50 rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-700/50'>
          <h2 className={`text-white ${fontWeights.semibold} text-lg`}>Add New Tenant</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50'
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Form */}
        <div className='p-6 flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <Label>Company Name</Label>
            <TextInput
              icon={<IoBusinessOutline size={20} color='#888888' />}
              placeholder='Enter company name'
              value={formData.companyName}
              onChange={e => handleChange('companyName', e.target.value)}
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label>Address</Label>
            <TextInput
              icon={<IoLocationOutline size={20} color='#888888' />}
              placeholder='Enter address'
              value={formData.address}
              onChange={e => handleChange('address', e.target.value)}
            />
          </div>

          <div className='border-t border-gray-700/50 pt-4'>
            <p className={`text-gray-400 text-xs ${fontWeights.medium} mb-3 uppercase tracking-wider`}>
              Admin User Details
            </p>
          </div>

          <div className='flex flex-col gap-2'>
            <Label>Full Name</Label>
            <TextInput
              icon={<IoPersonOutline size={20} color='#888888' />}
              placeholder='Enter full name'
              value={formData.fullName}
              onChange={e => handleChange('fullName', e.target.value)}
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label>Email</Label>
            <TextInput
              icon={<IoMailOutline size={20} color='#888888' />}
              placeholder='Enter email'
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label>Password</Label>
            <PasswordInput
              icon={<IoLockClosed size={20} color='#888888' />}
              placeholder='Enter password'
              value={formData.password}
              onChange={e => handleChange('password', e.target.value)}
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label>Confirm Password</Label>
            <PasswordInput
              icon={<IoLockClosed size={20} color='#888888' />}
              placeholder='Confirm password'
              value={formData.confirmPassword}
              onChange={e => handleChange('confirmPassword', e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className='flex gap-3 p-6 border-t border-gray-700/50'>
          <ButtonComponent
            children='Cancel'
            className={`flex-1 py-2 rounded-full border border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-colors ${fontWeights.medium}`}
            onClick={onClose}
            disabled={updateLoading}
          />
          <ButtonComponent
            children={updateLoading ? 'Creating...' : 'Create Tenant'}
            className={`flex-1 py-2 rounded-full ${bgcolors.primary} ${textcolors.white} ${fontWeights.semibold} flex items-center justify-center`}
            onClick={handleSubmit}
            disabled={updateLoading}
          />
        </div>
      </div>
    </div>
  )
}

export default AddTenantModal

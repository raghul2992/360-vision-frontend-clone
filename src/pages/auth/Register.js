import {
  IoLockClosed,
  IoMailOutline,
  IoPersonOutline,
  IoBusinessOutline,
  IoLocationOutline
} from 'react-icons/io5'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Label from '../../component/Label'
import TextInput from '../../component/TextInput'
import { bgcolors, fontWeights, textcolors, textSizes } from '../../theme'
import PasswordInput from '../../component/PasswordInput'
import ButtonComponent from '../../component/Button'
import { useTranslation } from 'react-i18next'
import { registerUser } from '../../features/auth/authSlice'
import { toast } from 'react-toastify'

const RegisterPage = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { isLoading, error } = useSelector(state => state.auth)

  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      const res = await dispatch(
        registerUser({
          companyName: formData.companyName,
          address: formData.address,
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password
        })
      ).unwrap()
      // console.log(res)

      if (res) {
        toast.success('Registered successfully')
        const event = new CustomEvent('registersuccess', {
          detail: { success: true }
        })
        window.dispatchEvent(event)
      }
    } catch (error) {
      console.error('Registration failed:', error)
    }
  }

  return (
    <div className='flex  flex-col justify-start items-center w-full'>
      <div className='mb-3'>
        <h2 className={`${fontWeights.semibold} ${textSizes.title1}`}>
          {t('register.create_account')}
        </h2>
        <p
          className={`${textSizes.subtitle} ${textcolors.normaltext} ${fontWeights.normal}`}
        >
          {t('register.help_message')}
        </p>
      </div>

      {/* Company Name Field */}
      <div className='flex flex-col gap-3 w-full p-1 items-start'>
        <Label>{t('register.company_name')}</Label>
        <TextInput
          icon={<IoBusinessOutline size={20} color='#888888' />}
          placeholder={t('register.company_name_placeholder')}
          value={formData.companyName}
          onChange={e => handleInputChange('companyName', e.target.value)}
        />
        <p className={`${textSizes.small} ${textcolors.normaltext}`}>
          {t('register.company_name_description')}
        </p>
      </div>

      {/* Address Field */}
      <div className='flex flex-col gap-3 w-full p-1 items-start'>
        <Label>{t('register.address')}</Label>
        <TextInput
          icon={<IoLocationOutline size={20} color='#888888' />}
          placeholder={t('register.address_placeholder')}
          value={formData.address}
          onChange={e => handleInputChange('address', e.target.value)}
        />
      </div>

      {/* Full Name Field */}
      <div className='flex flex-col gap-3 w-full p-1 items-start'>
        <Label>{t('register.full_name')}</Label>
        <TextInput
          icon={<IoPersonOutline size={20} color='#888888' />}
          placeholder={t('register.full_name_placeholder')}
          value={formData.fullName}
          onChange={e => handleInputChange('fullName', e.target.value)}
        />
      </div>

      {/* Email Field */}
      <div className='flex flex-col gap-3 w-full p-1 items-start'>
        <Label>{t('register.email')}</Label>
        <TextInput
          icon={<IoMailOutline size={20} color='#888888' />}
          placeholder={t('register.email_placeholder')}
          value={formData.email}
          onChange={e => handleInputChange('email', e.target.value)}
        />
      </div>

      {/* Password Field */}
      <div className='flex flex-col gap-3 w-full p-1 items-start'>
        <Label>{t('register.password')}</Label>
        <PasswordInput
          icon={<IoLockClosed size={20} color='#888888' />}
          placeholder={t('register.password_placeholder')}
          value={formData.password}
          onChange={e => handleInputChange('password', e.target.value)}
        />
      </div>

      {/* Confirm Password Field */}
      <div className='flex flex-col gap-3 w-full p-1 items-start'>
        <Label>{t('register.confirm_password')}</Label>
        <PasswordInput
          icon={<IoLockClosed size={20} color='#888888' />}
          placeholder={t('register.confirm_password_placeholder')}
          value={formData.confirmPassword}
          onChange={e => handleInputChange('confirmPassword', e.target.value)}
        />
      </div>

      {/* Submit Button */}
      <div className='p-1 w-full'>
        <ButtonComponent
          onClick={handleSubmit}
          disabled={isLoading}
          className={`${fontWeights.semibold} ${textcolors.white} ${textSizes.base} ${bgcolors.primary} w-full py-[8px] px-[16px] flex items-center justify-center rounded-[100px]`}
        >
          {isLoading
            ? t('register.loading')
            : t('register.create_account_button')}
        </ButtonComponent>
      </div>

      {/* Error Display */}
      {/* {error && (
        <p className={`${textcolors.error} ${textSizes.small} mt-2`}>
          {error}
        </p>
      )} */}
    </div>
  )
}

export default RegisterPage

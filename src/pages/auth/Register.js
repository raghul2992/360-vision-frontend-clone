import {
  IoLockClosed,
  IoMailOutline,
  IoPersonOutline,
  IoBusinessOutline,
  IoLocationOutline,
  IoShieldCheckmarkOutline
} from 'react-icons/io5'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Label from '../../component/Label'
import TextInput from '../../component/TextInput'
import { bgcolors, fontWeights, textcolors, textSizes } from '../../theme'
import PasswordInput from '../../component/PasswordInput'
import ButtonComponent from '../../component/Button'
import { useTranslation } from 'react-i18next'
import {
  registerUser,
  sendOtp,
  clearError,
  resetOtpState
} from '../../features/auth/authSlice'
import { toast } from 'react-toastify'

const RegisterPage = ({ callbackScreen }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { isLoading, error, otpSent } = useSelector(state => state.auth)

  const [showOTP, setShowOTP] = useState(false)
  const [otp, setOtp] = useState('')
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes in seconds
  const [canResend, setCanResend] = useState(false)

  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // OTP Timer Effect
  useEffect(() => {
    if (showOTP && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        clearInterval(timer)
      }
    }
  }, [showOTP, timeLeft])

  // Handle OTP sent success
  useEffect(() => {
    if (otpSent) {
      setShowOTP(true)
      setTimeLeft(180)
      setCanResend(false)
    }
  }, [otpSent])

  useEffect(() => {
    if (error) {
      // toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Step 1: Get OTP (doesn't clear form data)
  const handleGetOtp = async () => {
    // Validation
    if (
      !formData.companyName ||
      !formData.address ||
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      toast.error(
        t('register.all_fields_required') || 'All fields are required'
      )
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('register.password_mismatch') || 'Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      toast.error(
        t('register.password_length') ||
          'Password must be at least 8 characters'
      )
      return
    }

    try {
      // Send OTP without clearing form data
      const res = await dispatch(sendOtp({ email: formData.email })).unwrap()
      toast.success(res.data.message)
    } catch (error) {
      toast.error(error)
      console.error('Send OTP failed:', error)
    }
  }

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(0, 1)
    }

    if (!/^\d*$/.test(value)) {
      return
    }

    const newOtp = otp.split('')
    while (newOtp.length < 6) newOtp.push('')
    newOtp[index] = value
    const updatedOtp = newOtp.join('')
    setOtp(updatedOtp)

    // Auto focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }

    // Removed auto-submit - will use button instead
  }

  const handleOtpKeyDown = (index, e) => {
    const otpArray = otp.split('')
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  // Step 2: Register with OTP directly
  const handleRegisterWithOtp = async (otpValue = otp) => {
    if (otpValue.length !== 6) {
      toast.error(
        t('register.enter_complete_otp') || 'Please enter complete OTP'
      )
      return
    }

    if (timeLeft === 0) {
      toast.error(
        t('register.otp_expired') ||
          'OTP has expired. Please request a new one.'
      )
      return
    }

    try {
      // Register with OTP and existing form data
      const res = await dispatch(
        registerUser({
          companyName: formData.companyName,
          address: formData.address,
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          otp: otpValue
        })
      ).unwrap()

      if (res) {
        // console.log(res)
        toast.success('Registration Successfull. Please Login')
        dispatch(resetOtpState())
        // Clear form data after successful registration
        setFormData({
          companyName: '',
          address: '',
          fullName: '',
          email: '',
          password: '',
          confirmPassword: ''
        })
        setOtp('')
        callbackScreen('login')
      }
    } catch (error) {
      setOtp('')
      setShowOTP(false)
      toast.error(
        error || t('register.invalid_otp') || 'Invalid OTP. Please try again.'
      )
    }
  }

  const handleResendOtp = async () => {
    if (!canResend) {
      toast.info(
        t('register.wait_to_resend') ||
          'Please wait before requesting a new OTP'
      )
      return
    }

    try {
      // Resend OTP using existing email from form data
      const res = await dispatch(sendOtp({ email: formData.email })).unwrap()
      setOtp('')
      setTimeLeft(180)
      setCanResend(false)
      document.getElementById('otp-0')?.focus()
      toast.success(res.data.message)
    } catch (error) {
      toast.error(t('register.resend_failed') || 'Failed to resend OTP')
    }
  }

  const handleBackToRegistration = () => {
    setShowOTP(false)
    setOtp('')
    setTimeLeft(180)
    setCanResend(false)
    dispatch(resetOtpState())
    // Form data is preserved when going back
  }

  // Format time as MM:SS
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // OTP Entry Screen
  if (showOTP) {
    return (
      <div className='flex flex-col justify-start items-center w-full'>
        <div className='mb-6 text-center'>
          <div className='flex justify-center mb-4'>
            <div
              className={`${bgcolors.primary} bg-opacity-10 p-4 rounded-full`}
            >
              <IoShieldCheckmarkOutline
                size={48}
                className={textcolors.primary}
              />
            </div>
          </div>
          <h2 className={`${fontWeights.semibold} ${textSizes.title1} mb-2`}>
            {t('register.verify_email') || 'Verify Your Email'}
          </h2>
          <p
            className={`${textSizes.subtitle} ${textcolors.normaltext} ${fontWeights.normal}`}
          >
            {t('register.otp_message') || `We've sent a verification code to`}
          </p>
          <p
            className={`${textSizes.subtitle} ${textcolors.primary} ${fontWeights.semibold}`}
          >
            {formData.email}
          </p>
        </div>

        {/* Timer Display */}
        <div className='mb-4'>
          <div
            className={`text-center ${
              timeLeft <= 30 ? 'text-red-500' : textcolors.normaltext
            }`}
          >
            <p className={`${textSizes.base} ${fontWeights.semibold}`}>
              {timeLeft > 0
                ? `${
                    t('register.otp_expires_in') || 'OTP expires in'
                  }: ${formatTime(timeLeft)}`
                : t('register.otp_expired') || 'OTP has expired'}
            </p>
          </div>
        </div>

        {/* OTP Input Fields */}
        <div className='flex flex-col gap-3 w-full p-1 items-center mb-6'>
          <Label>{t('register.enter_otp') || 'Enter Verification Code'}</Label>
          <div className='flex gap-3 justify-center'>
            {[0, 1, 2, 3, 4, 5].map(index => (
              <input
                key={index}
                id={`otp-${index}`}
                type='text'
                inputMode='numeric'
                maxLength='1'
                value={otp[index] || ''}
                onChange={e => handleOtpChange(index, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(index, e)}
                disabled={timeLeft === 0 || isLoading}
                className={`w-12 h-12 text-center ${textSizes.title2} ${
                  fontWeights.semibold
                } border-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors ${
                  timeLeft === 0 || isLoading
                    ? 'bg-gray-100 cursor-not-allowed'
                    : ''
                }`}
                style={{ borderColor: otp[index] ? '#3b82f6' : '#e5e7eb' }}
              />
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className='p-1 w-full mb-4'>
          <ButtonComponent
            onClick={() => handleRegisterWithOtp()}
            disabled={isLoading || timeLeft === 0 || otp.length !== 6}
            className={`${fontWeights.semibold} ${textcolors.white} ${
              textSizes.base
            } ${
              bgcolors.primary
            } w-full py-[8px] px-[16px] flex items-center justify-center rounded-[100px] ${
              isLoading || timeLeft === 0 || otp.length !== 6
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            {isLoading
              ? t('register.registering') || 'Creating your account...'
              : t('register.submit_registration') || 'Submit & Register'}
          </ButtonComponent>
        </div>

        {/* Resend OTP */}
        <div className='text-center mb-2'>
          <p className={`${textSizes.small} ${textcolors.normaltext}`}>
            {t('register.didnt_receive') || "Didn't receive the code?"}
          </p>
          <button
            onClick={handleResendOtp}
            disabled={!canResend || isLoading}
            className={`${textSizes.small} ${
              canResend ? textcolors.primary : textcolors.normaltext
            } ${fontWeights.semibold} ${
              canResend ? 'hover:underline' : 'cursor-not-allowed opacity-50'
            }`}
          >
            {t('register.resend_otp') || 'Resend OTP'}
            {!canResend && timeLeft > 0 && ` (${formatTime(timeLeft)})`}
          </button>
        </div>

        {/* Back to Registration - Form data preserved */}
        <button
          onClick={handleBackToRegistration}
          disabled={isLoading}
          className={`${textSizes.small} ${
            textcolors.normaltext
          } mt-4 hover:underline ${
            isLoading ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          {t('register.back_to_registration') || '← Back to Registration'}
        </button>
      </div>
    )
  }

  // Registration Form Screen
  return (
    <div className='flex flex-col justify-start items-center w-full'>
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

      {/* Get OTP Button - Step 1 */}
      <div className='p-1 w-full'>
        <ButtonComponent
          onClick={handleGetOtp}
          disabled={isLoading}
          className={`${fontWeights.semibold} ${textcolors.white} ${textSizes.base} ${bgcolors.primary} w-full py-[8px] px-[16px] flex items-center justify-center rounded-[100px]`}
        >
          {isLoading
            ? t('register.sending_otp') || 'Sending OTP...'
            : t('register.get_otp_button') || 'Get OTP'}
        </ButtonComponent>
      </div>
    </div>
  )
}

export default RegisterPage

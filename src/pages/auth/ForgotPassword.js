import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IoMailOutline } from 'react-icons/io5'
import {
  bgcolors,
  bordercolor,
  fontWeights,
  textcolors,
  textSizes
} from '../../theme'
import ButtonComponent from '../../component/Button'
import Label from '../../component/Label'
import TextInput from '../../component/TextInput'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { forgotPassword } from '../../features/auth/authSlice'
import { toast } from 'react-toastify'
import SuccessDisplay from '../../component/SuccessDisplay'
import '../../styles/login.css'

const ForgotPasswordPage = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { isLoading } = useSelector(state => state.auth)

  const [email, setEmail] = useState('')
  const [resetLinkSent, setResetLinkSent] = useState(false)

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error(t('forgot_password.email_required'))
      return
    }
    try {
      const redirect_url = window.location.origin + '/reset-password'

      await dispatch(forgotPassword({ email, redirect_url })).unwrap()
      setResetLinkSent(true)
      toast.success(t('forgot_password.reset_link_sent'))
    } catch (err) {
      toast.error(err.message || t('forgot_password.reset_error'))
    }
  }

  return (
    <div className='flex h-screen flex-col lg:flex-row'>
      {/* Left banner */}
      <div className='max-h-screen flex-1 login-left hidden lg:block'></div>

      {/* Right content */}
      <div className={`max-h-screen ${bgcolors.white} flex-1`}>
        <div className='flex justify-center items-center'>
          <div className='flex flex-col items-center justify-center text-center h-full lg:h-screen px-4 sm:px-6 lg:px-0'>
            <h1
              className={`${textSizes.title2} ${textcolors.dark} mb-2 text-xl sm:text-2xl lg:text-3xl`}
            >
              {t('forgot_password.title')}
            </h1>

            <span
              className={`${textcolors.dark} ${textSizes.extrasmall} mb-3 text-sm sm:text-base lg:text-lg`}
            >
              {t('forgot_password.subtitle')}
            </span>

            {!resetLinkSent ? (
              <div
                className={`border-2 ${bgcolors.white} p-4 sm:p-8 flex flex-col w-full sm:min-w-[340px] lg:min-w-[440px] mb-2 rounded-[20px]`}
              >
                <div className='flex flex-col gap-3 w-full p-1 items-start'>
                  <Label>{t('forgot_password.email')}</Label>

                  <TextInput
                    icon={<IoMailOutline size={20} color='#888888' />}
                    placeholder={t('forgot_password.email_placeholder')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div className='p-1 w-full'>
                  <ButtonComponent
                    children={
                      isLoading
                        ? t('forgot_password.sending_link')
                        : t('forgot_password.send_reset_link')
                    }
                    className={`${fontWeights.semibold} ${textcolors.white} ${textSizes.base} ${bgcolors.primary} w-full py-[8px] rounded-[100px]`}
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                  />
                </div>
              </div>
            ) : (
              <SuccessDisplay
                email={email}
                tenantId={localStorage.getItem('tenant_id')}
                appUrl={`${window.location.origin}/reset-password`}
              />
            )}

            <div className='mt-4'>
              <p className={`${textSizes.base} ${textcolors.dark}`}>
                {t('forgot_password.remember_password')}{' '}
                <Link to='/' className={`${textcolors.link}`}>
                  {t('forgot_password.sign_in_here')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage

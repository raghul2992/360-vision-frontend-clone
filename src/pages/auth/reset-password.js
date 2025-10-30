import {
  bgcolors,
  bordercolor,
  fontWeights,
  textcolors,
  textSizes
} from '../../theme'
import Label from '../../component/Label'
import TextInput from '../../component/TextInput'
import { IoMailOutline } from 'react-icons/io5'
import ButtonComponent from '../../component/Button'
import '../../styles/login.css'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { forgotPassword } from '../../features/auth/authSlice'
import { useState } from 'react'
import SuccessDisplay from '../../component/SuccessDisplay'

const ResetPasswordPage = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { isLoading, error, success } = useSelector(state => state.auth)
  const [email, setEmail] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const tenant_id = localStorage.getItem('tenant_id')
    dispatch(forgotPassword({ tenant_id, email }))
  }

  return (
    <div className='flex h-screen flex-col lg:flex-row'>
      {/* left banner */}
      <div className={`max-h-screen flex-1 login-left hidden lg:block`}></div>

      {/* right content */}
      <div className={`max-h-screen ${bgcolors.dark} flex-1`}>
        <div className='flex justify-center items-center'>
          <div
            className={`flex flex-col items-center justify-center text-center h-full lg:h-screen px-4 sm:px-6 lg:px-0`}
          >
            <h1
              className={`${textSizes.title2} ${textcolors.white} mb-2 text-xl sm:text-2xl lg:text-3xl 4k:text-5xl`}
            >
              {t('reset_password.title')}
            </h1>
            <span
              className={`${textcolors.white} ${textSizes.extrasmall} mb-3 text-sm sm:text-base lg:text-lg 4k:text-2xl`}
            >
              {t('reset_password.subtitle')}
            </span>

            {success ? <SuccessDisplay email={email} /> : <div
              className={`${bgcolors.white} p-4 sm:p-8 flex flex-col w-full sm:min-w-[340px] lg:min-w-[440px] mb-2 rounded-[20px] justify-start items-start`}
            >
              <Link to={'/'}>
                <div className='flex gap-3 items-center justify-start'>
                  <svg
                    width='24'
                    height='23'
                    viewBox='0 0 24 23'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      fill-rule='evenodd'
                      clip-rule='evenodd'
                      d='M12.2233 4.2689C12.6443 4.68993 12.6443 5.37257 12.2233 5.7936L7.59501 10.4219H19.0078C19.6032 10.4219 20.0859 10.9046 20.0859 11.5C20.0859 12.0954 19.6032 12.5781 19.0078 12.5781H7.59501L12.2233 17.2064C12.6443 17.6274 12.6443 18.3101 12.2233 18.7311C11.8023 19.1521 11.1196 19.1521 10.6986 18.7311L4.22984 12.2624C3.8088 11.8413 3.8088 11.1587 4.22984 10.7377L10.6986 4.2689C11.1196 3.84787 11.8023 3.84787 12.2233 4.2689Z'
                      fill='#313131'
                    />
                  </svg>
                  <h2 className={`${fontWeights.semibold} ${textSizes.title1}`}>
                    {t('reset_password.reset_password_heading')}
                  </h2>
                </div>
              </Link>
              <div className='flex flex-col justify-start items-center w-full'>
                <div className='flex flex-col gap-3 w-full p-1 mb-1 items-start'>
                  <Label>{t('reset_password.email')}</Label>
                  <TextInput
                    icon={<IoMailOutline size={20} color='#888888' />}
                    placeholder={t('reset_password.email_placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className='p-1 w-full'>
                  <ButtonComponent
                    onClick={handleSubmit}
                    children={t('reset_password.send_reset_link')}
                    className={`${fontWeights.semibold} ${textcolors.white} ${textSizes.base} ${bgcolors.primary} w-full py-[8px] px-[16px] flex items-center justify-center rounded-[100px]`}
                    isLoading={isLoading}
                  />
                </div>

                <div className='p-1 w-full'>
                  <a href='/'>
                    <ButtonComponent
                      children={t('reset_password.back_to_login')}
                      className={`${fontWeights.semibold} ${textcolors.normaltext} ${textSizes.base} border-[1px] border-[${bordercolor.borderline}] w-full py-[8px] px-[16px] flex items-center justify-center rounded-[100px]`}
                    />
                  </a>
                </div>
                {error && <p className='text-red-500'>{error}</p>}
              </div>
            </div>}
            <div className='mt-1'>
              <p className={`${textSizes.base} ${textcolors.white}`}>
                {t('reset_password.remember_password')}{' '}
                <a href='/' className={`${textcolors.link}`}>
                  {' '}
                  {t('reset_password.sign_in_here')}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage

import React, { useState, useEffect } from 'react'
import {
  bgcolors,
  bordercolor,
  fontWeights,
  textcolors,
  textSizes
} from '../../theme'
import Label from '../../component/Label'
import PasswordInput from '../../component/PasswordInput'
import { IoLockClosed } from 'react-icons/io5'
import ButtonComponent from '../../component/Button'
import '../../styles/login.css'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { resetPassword } from '../../features/auth/authSlice'
import { toast } from 'react-toastify'
import SuccessDisplay from '../../component/SuccessDisplay'

// 1. Import Swiper and Modules
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, EffectFade } from 'swiper/modules'

// 2. Import Swiper Styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'

// Import Images
import banner_1 from '../../assets/banner/1.jpg'
import banner_2 from '../../assets/banner/2.jpg'
import banner_3 from '../../assets/banner/3.png'

// 3. Define Carousel Data
const carouselSlides = [
  {
    id: 1,
    image: banner_1,
    title: 'Conformidade e segurança real',
    description:
      'Previna acidentes monitorando o uso de EPIs e proibindo comportamentos de risco, como o uso de celulares nas bombas de abastecimento.'
  },
  {
    id: 2,
    image: banner_2,
    title: 'Conformidade e segurança real',
    description:
      'Previna acidentes monitorando o uso de EPIs e proibindo comportamentos de risco, como o uso de celulares nas bombas de abastecimento.'
  },
  {
    id: 3,
    image: banner_3,
    title: 'Conformidade e segurança real',
    description:
      'Previna acidentes monitorando o uso de EPIs e proibindo comportamentos de risco, como o uso de celulares nas bombas de abastecimento.'
  }
]

const ResetPasswordPage = ({ acceptinvitation = false }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const { isLoading, error, success } = useSelector(state => state.auth)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      toast.error(t('reset_password.invalid_token'))
      // Optionally redirect to an error page or login
    }
  }, [token, t])

  useEffect(() => {
    if (passwordResetSuccess) {
      setTimeout(() => {
        navigate('/')
      }, 3000) // Redirect after 3 seconds to show success message
    }
  }, [passwordResetSuccess, navigate])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!newPassword || !confirmNewPassword) {
      toast.error(t('reset_password.all_fields_required'))
      return
    }
    if (newPassword !== confirmNewPassword) {
      toast.error(t('reset_password.password_mismatch'))
      return
    }
    if (newPassword.length < 8) {
      toast.error(t('reset_password.password_length'))
      return
    }

    try {
      const res = await dispatch(
        resetPassword({ token, new_password: newPassword })
      ).unwrap()
      console.log(res)
      if (res.status === 200) {
        toast.success(t('reset_password.password_reset_success'))
        navigate('/')
      }
      // setPasswordResetSuccess(true)
    } catch (err) {
      toast.error(err.message || t('reset_password.reset_error'))
    }
  }

  return (
    <div className='flex h-screen  flex-col lg:flex-row relative'>
      {/* left banner */}
      <div
        className={`max-h-screen flex-1 h-[100%] login-left hidden lg:block`}
      ></div>

      {/* right content */}
      <div className={`max-h-screen ${bgcolors.white} flex-1 sm:py-8 overflow-y-scroll`}>
        <div className='flex justify-center items-center'>
          <div
            className={`flex flex-col items-center justify-center text-center h-full lg:h-screen px-4 sm:px-6 lg:px-0`}
          >
            <h1
              className={`${textSizes.title2} ${textcolors.dark} mb-2 text-xl sm:text-2xl lg:text-3xl 4k:text-5xl`}
            >
              {acceptinvitation
                ? 'Complete Your Registration'
                : t('reset_password.title')}
            </h1>

            <span
              className={`${textcolors.dark} ${textSizes.extrasmall} mb-2 text-sm sm:text-base lg:text-lg 4k:text-2xl`}
            >
              {acceptinvitation
                ? 'Create a secure password to finish setting up your account.'
                : t('reset_password.subtitle')}
            </span>

            {passwordResetSuccess ? (
              <SuccessDisplay message={t('reset_password.success_message')} />
            ) : (
              <div
                className={`border-2 ${bgcolors.white} p-4 sm:p-8 flex flex-col w-full sm:min-w-[340px] lg:min-w-[440px] mb-2 rounded-[20px] justify-start items-start`}
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
                        fillRule='evenodd'
                        clipRule='evenodd'
                        d='M12.2233 4.2689C12.6443 4.68993 12.6443 5.37257 12.2233 5.7936L7.59501 10.4219H19.0078C19.6032 10.4219 20.0859 10.9046 20.0859 11.5C20.0859 12.0954 19.6032 12.5781 19.0078 12.5781H7.59501L12.2233 17.2064C12.6443 17.6274 12.6443 18.3101 12.2233 18.7311C11.8023 19.1521 11.1196 19.1521 10.6986 18.7311L4.22984 12.2624C3.8088 11.8413 3.8088 11.1587 4.22984 10.7377L10.6986 4.2689C11.1196 3.84787 11.8023 3.84787 12.2233 4.2689Z'
                        fill='#313131'
                      />
                    </svg>
                    <h2
                      className={`${fontWeights.semibold} ${textSizes.title1}`}
                    >
                      {t('reset_password.reset_password_heading')}
                    </h2>
                  </div>
                </Link>
                <div className='flex flex-col justify-start items-center w-full'>
                  <div className='flex flex-col gap-3 w-full p-1 mb-1 items-start'>
                    <Label>{t('reset_password.new_password')}</Label>
                    <PasswordInput
                      icon={<IoLockClosed size={20} color='#888888' />}
                      placeholder={t('reset_password.new_password_placeholder')}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className='flex flex-col gap-3 w-full p-1 mb-1 items-start'>
                    <Label>{t('reset_password.confirm_new_password')}</Label>
                    <PasswordInput
                      icon={<IoLockClosed size={20} color='#888888' />}
                      placeholder={t(
                        'reset_password.confirm_new_password_placeholder'
                      )}
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                    />
                  </div>
                  <div className='p-1 w-full'>
                    <ButtonComponent
                      onClick={handleSubmit}
                      children={t('reset_password.reset_password_button')}
                      className={`${fontWeights.semibold} ${textcolors.white} ${textSizes.base} ${bgcolors.primary} w-full py-[8px] px-[16px] flex items-center justify-center rounded-[100px]`}
                      isLoading={isLoading}
                    />
                  </div>

                  <div className='p-1 w-full'>
                    <Link to='/'>
                      <ButtonComponent
                        children={t('reset_password.back_to_login')}
                        className={`${fontWeights.semibold} ${textcolors.normaltext} ${textSizes.base} border-[1px] border-[${bordercolor.borderline}] w-full py-[8px] px-[16px] flex items-center justify-center rounded-[100px]`}
                      />
                    </Link>
                  </div>
                  {error && <p className='text-red-500'>{error}</p>}
                </div>
              </div>
            )}
            <div className='mt-1'>
              <p className={`${textSizes.base} ${textcolors.dark}`}>
                {t('reset_password.remember_password')}{' '}
                <Link to='/' className={`${textcolors.link}`}>
                  {t('reset_password.sign_in_here')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage

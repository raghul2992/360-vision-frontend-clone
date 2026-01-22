import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IoMailOutline } from 'react-icons/io5'
import { bgcolors, fontWeights, textcolors, textSizes } from '../../theme'
import ButtonComponent from '../../component/Button'
import Label from '../../component/Label'
import TextInput from '../../component/TextInput'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { forgotPassword } from '../../features/auth/authSlice'
import { toast } from 'react-toastify'
import SuccessDisplay from '../../component/SuccessDisplay'
import '../../styles/login.css'

// 1. Import Swiper and Modules
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, EffectFade } from 'swiper/modules'

// 2. Import Swiper Styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'

// Import Images
import banner_1 from '../../assets/banner/1.png'
import banner_2 from '../../assets/banner/2.png'
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
    <div className='flex h-screen flex-col lg:flex-row relative'>
      {/* --- LEFT BANNER (CAROUSEL) --- */}
      <div
        className={`max-h-screen w-[40%] h-[100%] hidden lg:block overflow-hidden relative`}
      >
        <Swiper
          spaceBetween={0}
          centeredSlides={true}
          effect={'fade'}
          autoplay={{
            delay: 4500, // Slightly slower to allow reading text
            disableOnInteraction: false
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true
          }}
          modules={[Autoplay, Pagination, EffectFade]}
          className='h-full w-full'
        >
          {carouselSlides.map(slide => (
            <SwiperSlide key={slide.id}>
              <div className='relative h-full w-full'>
                {/* Image */}
                <img
                  src={slide.image}
                  alt={slide.title}
                  className='h-full w-full object-fill bg-[#1c1c24]'
                />

                <div className='absolute inset-0 '></div>

                {/* Text on Carousel - CENTER BOTTOM */}
                {/* absolute: takes it out of flow
                         bottom-0: aligns to bottom
                         w-full: spans full width
                         pb-16: padding bottom to make room for pagination dots
                         flex-col/items-center: centers content horizontally
                      */}
                <div className='absolute -bottom-11 left-0 w-full pb-16 px-10 text-white z-10 flex flex-col items-center justify-end text-center'>
                  <h2 className='text-1xl lg:text-2xl font-bold mb-3'>
                    {slide.title}
                  </h2>
                  <p className='text-base lg:text-[14px] max-w-xl font-light opacity-90'>
                    {slide.description}
                  </p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      {/* --- END LEFT BANNER --- */}

      {/* Right content */}
      <div className={`max-h-screen ${bgcolors.white} flex-1 overflow-y-auto`}>
        <div className='flex justify-center items-center h-full'>
          <div className='flex flex-col items-center justify-center text-center h-full px-4 sm:px-6 lg:px-0'>
            <h1
              className={`${textSizes.title2} ${textcolors.black} mb-2 text-xl sm:text-2xl lg:text-3xl`}
            >
              {t('forgot_password.title')}
            </h1>

            <span
              className={`${textcolors.black} ${textSizes.extrasmall} mb-3 text-sm sm:text-base lg:text-lg`}
            >
              {t('forgot_password.subtitle')}
            </span>

            {!resetLinkSent ? (
              <div
                className={`${bgcolors.white} border-[2px] p-4 sm:p-8 flex flex-col w-full sm:min-w-[340px] lg:min-w-[440px] mb-2 rounded-[20px]`}
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
              <p className={`${textSizes.base} ${textcolors.black}`}>
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

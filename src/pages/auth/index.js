import '../../styles/login.css'
import { bgcolors, fontWeights, textcolors, textSizes } from '../../theme'
import ButtonComponent from '../../component/Button'
import { useState, useEffect } from 'react'
import LoginPage from './Login'
import RegisterPage from './Register'
import { useTranslation } from 'react-i18next'

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
import banner_3 from '../../assets/banner/3.jpg'
import backgroundImage from '../../assets/auth-left-banner.png'

// 3. Define your Carousel Images/Data
// Updated with your specific text and added a 'description' field
const carouselSlides = [
  // {
  //   id: 1,
  //   image: banner_1,
  //   title: 'Conformidade e segurança real',
  //   description:
  //     'Previna acidentes monitorando o uso de EPIs e proibindo comportamentos de risco, como o uso de celulares nas bombas de abastecimento.'
  // },
  // {
  //   id: 2,
  //   image: banner_2,
  //   title: 'Maximize a rentabilidade do posto de abastecimento',
  //   description:
  //     'Monitore as filas, reduza o tempo ocioso das bombas e garanta que sua equipe atenda a todos os clientes no momento certo.'
  // },
  // {
  //   id: 3,
  //   image: banner_3,
  //   title: 'Proteção inteligente 24 horas por dia, 7 dias por semana.',
  //   description:
  //     'Detecte intrusões em áreas restritas, comportamentos suspeitos e proteja seus ativos fora do horário comercial com alertas em tempo real.'
  // },
  {
    id: 1,
    image: backgroundImage,
    // title: 'Conformidade e segurança real',
    // description:
    //   'Previna acidentes monitorando o uso de EPIs e proibindo comportamentos de risco, como o uso de celulares nas bombas de abastecimento.'
  }
]

const AuthPage = () => {
  const [authscreen, Setauthscreen] = useState('login')
  const { t } = useTranslation()

  // useEffect(() => {
  //   const handleRegisterSuccess = event => {
  //     if (event.detail.success) {
  //       Setauthscreen('login')
  //     }
  //   }

  //   window.addEventListener('registersuccess', handleRegisterSuccess)

  //   return () => {
  //     window.removeEventListener('registersuccess', handleRegisterSuccess)
  //   }
  // }, [])

  return (
    <div className='flex h-screen flex-col lg:flex-row relative'>
      {/* --- LEFT BANNER (CAROUSEL) --- */}
      <div
        className={`max-h-screen w-[45%] h-[100%] hidden lg:block overflow-hidden relative`}
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
                  className='h-full w-full object-cover bg-[#1c1c24]'
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

      {/* right banner */}
      <div
        className={`max-h-screen  ${bgcolors.white} flex-1 sm:py-8  ${
          authscreen !== 'login' ? 'lg:py-52' : 'lg:py-20'
        } overflow-y-scroll`}
      >
        <div className='flex justify-center items-center '>
          <div
            className={`flex flex-col items-center justify-center text-center h-full lg:h-screen px-4 sm:px-6 lg:px-0`}
          >
            <h1
              className={`${textSizes.title2} ${textcolors.dark} mb-2 text-xl sm:text-2xl lg:text-3xl 4k:text-5xl`}
            >
              {t('auth_page.welcome')}
            </h1>
            <span
              className={`${textcolors.dark} ${textSizes.extrasmall} mb-3 text-sm sm:text-base lg:text-lg 4k:text-2xl`}
            >
              {t('auth_page.help_message')}
            </span>
            <div
              className={`border-2 ${bgcolors.white} p-4 sm:p-8 flex flex-col w-full sm:min-w-[340px] lg:min-w-[440px] mb-2 rounded-[20px] justify-start items-start`}
            >
              {/* Tab switcher — registration temporarily disabled */}
              {/* <div
                className={`${bgcolors.gray} rounded-[20px] p-1 w-full flex items-start justify-center mb-2`}
              >
                <ButtonComponent
                  children={t('auth_page.login')}
                  className={`
                ${fontWeights.medium}
                ${textSizes.base}
                flex-1 flex py-1 items-start justify-center
                ${
                  authscreen === 'login' &&
                  `${bgcolors.primary} ${textcolors.white} rounded-[20px]`
                }
              `}
                  onClick={() => {
                    Setauthscreen('login')
                  }}
                />
                <ButtonComponent
                  children={t('auth_page.register')}
                  className={`
                ${fontWeights.medium}
                ${textSizes.base}
                flex-1 flex items-start py-1 justify-center
                ${
                  authscreen === 'register' &&
                  `${bgcolors.primary} ${textcolors.white} rounded-[20px]`
                }
              `}
                  onClick={() => {
                    Setauthscreen('register')
                  }}
                />
              </div>
              {authscreen === 'login' ? (
                <LoginPage callbackScreen={Setauthscreen} />
              ) : (
                <RegisterPage callbackScreen={Setauthscreen} />
              )} */}
              <LoginPage callbackScreen={Setauthscreen} />
            </div>
            <div
              className={`text-center min-w-[64px] ${textcolors.dark} text-xs sm:text-sm lg:text-base 4k:text-xl`}
            >
              <p className='w-full sm:w-[341.99px]'>
                {t('auth_page.terms')}{' '}
                <a href='https://360vision.ai/terms-of-use' target='_blank' className={`${textcolors.link}`}>
                  {t('auth_page.terms_of_service')}
                </a>{' '}
                {t('auth_page.and')}{' '}
                <a href='https://360vision.ai/privacy-policy' target='_blank' className={`${textcolors.link}`}>
                  {t('auth_page.privacy_policy')}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage

import '../../styles/login.css'
import { bgcolors, borderstyles, shadows, textcolors } from '../../theme'
import { useState } from 'react'
import LoginPage from './Login'
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
    <div className='auth-page flex h-screen flex-col lg:flex-row relative'>
      {/* --- LEFT BANNER (CAROUSEL) --- */}
      <div
        className={`auth-left-panel max-h-screen w-[45%] h-[100%] overflow-hidden relative`}
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
                  className={`h-full w-full object-cover ${bgcolors.dark}`}
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

      {/* right panel */}
      <div className={`flex-1 flex items-center justify-center ${bgcolors.page} overflow-y-auto py-10 px-4`}>
        <div className='flex flex-col items-center w-full max-w-[460px] my-auto'>
          <h1 className={`text-[28px] font-bold ${textcolors.dark} mb-1 tracking-tight`}>
            {t('auth_page.welcome')}
          </h1>
          <span className={`text-sm ${textcolors.slateBody} mb-7`}>
            {t('auth_page.help_message')}
          </span>

          {/* Card */}
          <div className={`w-full ${bgcolors.white} ${borderstyles.cardBorder} rounded-2xl p-5 sm:p-8`} style={{ boxShadow: shadows.authCard }}>
            <LoginPage callbackScreen={Setauthscreen} />
          </div>

          <div className={`mt-5 text-xs ${textcolors.slateCaption} text-center leading-5`}>
            <p>
              {t('auth_page.terms')}{' '}
              <a href='https://360vision.ai/terms-of-use' target='_blank' rel='noreferrer' className={`${textcolors.link} font-semibold hover:underline`}>
                {t('auth_page.terms_of_service')}
              </a>
            </p>
            <p>
              {t('auth_page.and')}{' '}
              <a href='https://360vision.ai/privacy-policy' target='_blank' rel='noreferrer' className={`${textcolors.link} font-semibold hover:underline`}>
                {t('auth_page.privacy_policy')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage

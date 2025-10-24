import '../../styles/login.css'
import { bgcolors, fontWeights, textcolors, textSizes } from '../../theme'
import ButtonComponent from '../../component/Button'
import { useState } from 'react'
import LoginPage from './Login'
import RegisterPage from './Register'
import { useTranslation } from 'react-i18next'

const AuthPage = () => {
  const [authscreen, Setauthscreen] = useState('login')
  const { t } = useTranslation()

  return (
    <div className='flex h-screen flex-col lg:flex-row relative'>
      {/* left banner */}
      <div className={`max-h-screen flex-1 login-left hidden lg:block`}></div>

      {/* right banner */}
      <div
        className={`max-h-screen ${bgcolors.dark} flex-1 py-10 sm:py-16 lg:py-28 overflow-y-scroll`}
      >
        <div className='flex justify-center items-center '>
          <div
            className={`flex flex-col items-center justify-center text-center h-full lg:h-screen px-4 sm:px-6 lg:px-0`}
          >
            <h1
              className={`${textSizes.title2} ${textcolors.white} mb-2 text-xl sm:text-2xl lg:text-3xl 4k:text-5xl`}
            >
              {t('auth_page.welcome')}
            </h1>
            <span
              className={`${textcolors.white} ${textSizes.extrasmall} mb-3 text-sm sm:text-base lg:text-lg 4k:text-2xl`}
            >
              {t('auth_page.help_message')}
            </span>
            <div
              className={`${bgcolors.white} p-4 sm:p-8 flex flex-col w-full sm:min-w-[340px] lg:min-w-[440px] mb-2 rounded-[20px] justify-start items-start`}
            >
              <div
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
              {authscreen === 'login' ? <LoginPage /> : <RegisterPage />}
            </div>
            <div
              className={`text-center min-w-[64px] ${textcolors.white} text-xs sm:text-sm lg:text-base 4k:text-xl`}
            >
              <p className='w-full sm:w-[341.99px]'>
                {t('auth_page.terms')}{' '}
                <a href='' className={`${textcolors.link}`}>
                  {t('auth_page.terms_of_service')}
                </a>{' '}
                {t('auth_page.and')}{' '}
                <a href='' className={`${textcolors.link}`}>
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

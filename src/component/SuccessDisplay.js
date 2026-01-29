import {
  bgcolors,
  bordercolor,
  fontWeights,
  textcolors,
  textSizes
} from '../theme'
import ButtonComponent from './Button'
import { useDispatch, useSelector } from 'react-redux'
import { forgotPassword } from '../features/auth/authSlice'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'

const SuccessDisplay = ({ email, tenantId, appUrl }) => {
  const dispatch = useDispatch()
  const { isLoading } = useSelector(state => state.auth)

  const handleResend = async () => {
    try {
      await dispatch(
        forgotPassword({ tenant_id: tenantId, email, app_url: appUrl })
      ).unwrap()
      toast.success(t('forgot_password.reset_link_sent'))
    } catch (err) {
      toast.error(err.message || t('forgot_password.reset_error'))
    }
  }
  const { t } = useTranslation()

  return (
    <div
      className={`border-2 ${bgcolors.white} p-4 sm:p-8 flex flex-col w-full sm:min-w-[340px] lg:w-[440px] mb-2 rounded-[20px] justify-start items-start`}
    >
      {/* Title Row */}
      {/* <div className='flex gap-3 items-center mb-4'>
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

        <h2 className={`${fontWeights.semibold} ${textSizes.title1}`}>
          {t('success_display.title')}
        </h2>
      </div> */}

      {/* Success Icon + Text */}
      <div className='flex flex-col items-center justify-center text-center w-full'>
        <svg
          width='60'
          height='60'
          viewBox='0 0 48 48'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          className='mb-3'
        >
          <path
            d='M24 4C12.96 4 4 12.96 4 24C4 35.04 12.96 44 24 44C35.04 44 44 35.04 44 24C44 12.96 35.04 4 24 4ZM20 34L10 24L12.82 21.18L20 28.34L35.18 13.16L38 16L20 34Z'
            fill='#4CAF50'
          />
        </svg>

        <p className={`${textSizes.base} ${textcolors.normaltext} mb-1`}>
          {t('success_display.message')}
        </p>

        <p
          className={`${textSizes.base} ${fontWeights.semibold} text-gray-800`}
        >
          {email}
        </p>

        <p className={`${textSizes.base} ${textcolors.normaltext} mt-2`}>
          {t('success_display.instructions')}
        </p>

        <p className={`${textSizes.base} ${textcolors.normaltext}`}>
          {t('success_display.spam_notice')}
        </p>
      </div>

      {/* Buttons */}
      <div className='w-full mt-5'>
        <ButtonComponent
          children={t('success_display.resend_button')}
          className={`${fontWeights.semibold} ${textcolors.normaltext} ${textSizes.base} border border-[${bordercolor.borderline}] w-full py-[8px] rounded-[100px]`}
          onClick={handleResend}
          disabled={isLoading}
        />
      </div>

      <div className='w-full mt-3'>
        <a href='/'>
          <ButtonComponent
            children={t('success_display.back_button')}
            className={`${fontWeights.semibold} ${textcolors.white} ${textSizes.base} ${bgcolors.primary} w-full py-[8px] rounded-[100px]`}
          />
        </a>
      </div>
    </div>
  )
}

export default SuccessDisplay

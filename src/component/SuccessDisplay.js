import {
  bgcolors,
  bordercolor,
  fontWeights,
  textcolors,
  textSizes
} from '../theme'
import ButtonComponent from './Button'
import { useTranslation } from 'react-i18next'

const SuccessDisplay = ({ email }) => {
  const { t } = useTranslation()
  return (
    <div
      className={`${bgcolors.white} p-4 sm:p-8 flex flex-col w-full sm:min-w-[280px] lg:min-w-[340px] mb-2 rounded-[20px] justify-start items-start`}
    >
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
          {t('success_display.title')}
        </h2>
      </div>
      <div className='flex flex-col justify-start items-center w-full'>
        <div className='flex flex-col gap-3 w-full p-1 mb-1 items-center'>
          <svg
            width='48'
            height='48'
            viewBox='0 0 48 48'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M24 4C12.96 4 4 12.96 4 24C4 35.04 12.96 44 24 44C35.04 44 44 35.04 44 24C44 12.96 35.04 4 24 4ZM20 34L10 24L12.82 21.18L20 28.34L35.18 13.16L38 16L20 34Z'
              fill='#4CAF50'
            />
          </svg>
          <p className={`${textSizes.base} ${textcolors.normaltext}`}>
            {t('success_display.message')}
            <span className={`${fontWeights.semibold}`}> {email}</span>
          </p>
          <p className={`${textSizes.base} ${textcolors.normaltext}`}>
            {t('success_display.instructions')}
          </p>
          <p className={`${textSizes.base} ${textcolors.normaltext}`}>
            {t('success_display.spam_notice')}
          </p>
        </div>
        <div className='p-1 w-full'>
          <ButtonComponent
            children={t('success_display.resend_button')}
            className={`${fontWeights.semibold} ${textcolors.normaltext} ${textSizes.base} border-[1px] border-[${bordercolor.borderline}] w-full py-[8px] px-[16px] flex items-center justify-center rounded-[100px]`}
          />
        </div>
        <div className='p-1 w-full'>
          <a href='/'>
            <ButtonComponent
              children={t('success_display.back_button')}
              className={`${fontWeights.semibold} ${textcolors.white} ${textSizes.base} ${bgcolors.primary} w-full py-[8px] px-[16px] flex items-center justify-center rounded-[100px]`}
            />
          </a>
        </div>
      </div>
    </div>
  )
}

export default SuccessDisplay
import {
  IoLockClosed,
  IoMailOutline,
  IoPerson,
  IoPersonOutline
} from 'react-icons/io5'
import Label from '../../component/Label'
import TextInput from '../../component/TextInput'
import { bgcolors, fontWeights, textcolors, textSizes } from '../../theme'
import PasswordInput from '../../component/PasswordInput'
import ButtonComponent from '../../component/Button'
import { useTranslation } from 'react-i18next'

const RegisterPage = () => {
  const { t } = useTranslation()
  return (
    <div className={`flex flex-col justify-start items-center w-full`}>
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
      <div className='flex flex-col gap-3 w-full p-1 items-start'>
        <Label>{t('register.full_name')}</Label>
        <TextInput
          icon={<IoPersonOutline size={20} color='#888888' />}
          placeholder={t('register.full_name_placeholder')}
        />
      </div>
      <div className='flex flex-col gap-3 w-full p-1 items-start'>
        <Label>{t('register.email')}</Label>
        <TextInput
          icon={<IoMailOutline size={20} color='#888888' />}
          placeholder={t('register.email_placeholder')}
        />
      </div>
      <div className='flex flex-col gap-3 w-full  p-1 items-start'>
        <Label>{t('register.password')}</Label>
        <PasswordInput
          icon={<IoLockClosed size={20} color='#888888' />}
          placeholder={t('register.password_placeholder')}
        />
      </div>
      <div className='flex flex-col gap-3 w-full  p-1 items-start'>
        <Label>{t('register.confirm_password')}</Label>
        <PasswordInput
          icon={<IoLockClosed size={20} color='#888888' />}
          placeholder={t('register.confirm_password_placeholder')}
        />
      </div>
      <div className='p-1 w-full '>
        <ButtonComponent
          children={t('register.create_account_button')}
          className={`${fontWeights.semibold} ${textcolors.white} ${textSizes.base} ${bgcolors.primary} w-full py-[8px] px-[16px]  flex items-center justify-center rounded-[100px]`}
        />
      </div>
    </div>
  )
}

export default RegisterPage

import React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import {
  IoCheckmarkCircleOutline,
  IoMailOpenOutline,
  IoPaperPlaneOutline
} from 'react-icons/io5'

const SendInvitationConfirm = ({
  fullName,
  onSend,
  onSkip,
  isInviting,
  title = 'Success!',
  isExistingUser = false
}) => {
  const { t } = useTranslation()

  return (
    <div className='p-10 flex flex-col items-center text-center animate-in zoom-in duration-300'>
      {/* Icon Section */}
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
          isExistingUser ? 'bg-blue-500/10' : 'bg-green-500/10'
        }`}
      >
        {isExistingUser ? (
          <IoPaperPlaneOutline className='text-blue-500 text-5xl' />
        ) : (
          <IoCheckmarkCircleOutline className='text-green-500 text-6xl' />
        )}
      </div>

      {/* Dynamic Title (Passed from parent) */}
      <h2 className='text-2xl font-bold text-white mb-2'>{title}</h2>

      {/* Dynamic Description with HTML (Trans component) */}
      <p className='text-gray-400 mb-8 max-w-xs leading-relaxed'>
        <Trans
          i18nKey={
            isExistingUser
              ? 'userManagement.invitation.existingBody'
              : 'userManagement.invitation.newBody'
          }
          values={{ name: fullName }}
          components={{ strong: <strong className='text-white' /> }}
        />
      </p>

      <div className='flex flex-col gap-3 w-full'>
        {/* Send Button */}
        <button
          onClick={onSend}
          disabled={isInviting}
          className='w-full py-3.5 rounded-xl bg-[#3b82f6] text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-600 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all'
        >
          <IoMailOpenOutline size={20} />
          {isInviting
            ? t('userManagement.invitation.sendingBtn')
            : t('userManagement.invitation.sendBtn')}
        </button>

        {/* Skip / Cancel Button */}
        <button
          onClick={onSkip}
          className='w-full py-3 text-gray-500 hover:text-white transition-colors font-medium text-sm'
        >
          {isExistingUser
            ? t('userManagement.invitation.cancelBtn')
            : t('userManagement.invitation.skipBtn')}
        </button>
      </div>
    </div>
  )
}

export default SendInvitationConfirm

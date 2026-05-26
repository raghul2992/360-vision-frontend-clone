import React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { CheckCircleIcon, MailOpenIcon, PaperPlaneIcon } from '../../../icons'
import { bgcolors, textcolors, colors } from '../../../theme'

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
          isExistingUser ? bgcolors.primaryFaintOpacity : bgcolors.successFaintOpacity
        }`}
      >
        {isExistingUser ? (
          <PaperPlaneIcon size={40} color={colors.primary} />
        ) : (
          <CheckCircleIcon size={48} color={colors.success} />
        )}
      </div>

      {/* Dynamic Title (Passed from parent) */}
      <h2 className={`text-2xl font-bold ${textcolors.normaltext} mb-2`}>{title}</h2>

      {/* Dynamic Description with HTML (Trans component) */}
      <p className={`${textcolors.dim} mb-8 max-w-xs leading-relaxed`}>
        <Trans
          i18nKey={
            isExistingUser
              ? 'userManagement.invitation.existingBody'
              : 'userManagement.invitation.newBody'
          }
          values={{ name: fullName }}
          components={{ strong: <strong className={`${textcolors.primary} font-semibold`} /> }}
        />
      </p>

      <div className='flex flex-col gap-3 w-full'>
        {/* Send Button */}
        <button
          onClick={onSend}
          disabled={isInviting}
          className={`w-full py-3.5 rounded-xl ${bgcolors.primary} text-white font-bold flex items-center justify-center gap-2 ${bgcolors.primaryHover} shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all`}
        >
          <MailOpenIcon size={20} />
          {isInviting
            ? t('userManagement.invitation.sendingBtn')
            : t('userManagement.invitation.sendBtn')}
        </button>

        {/* Skip / Cancel Button */}
        <button
          onClick={onSkip}
          className={`w-full py-3 ${textcolors.dim} ${textcolors.hoverDanger} transition-colors font-medium text-sm`}
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

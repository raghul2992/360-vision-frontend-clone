import { useMemo } from 'react'
import { WifiIcon, BanIcon, RefreshIcon, CloseCircleIcon } from '../../../icons'
import { bgcolors, borderstyles, textcolors, textSizes } from '../../../theme'

const CameraStatusSummary = ({ cameras }) => {
  const counts = useMemo(() => {
    const stats = { active: 0, inactive: 0, processing: 0, error: 0 }
    cameras.forEach(camera => {
      const status = camera.status?.toLowerCase() || 'inactive'
      if (stats[status] !== undefined) stats[status]++
    })
    return stats
  }, [cameras])

  const cards = [
    {
      key: 'active',
      label: 'Active (Good)',
      count: counts.active,
      icon: <WifiIcon size={20} />,
      accent: bgcolors.success,
      iconColor: textcolors.success,
      countColor: textcolors.successDark,
      border: borderstyles.successBorder,
      iconBg: bgcolors.successLight,
    },
    {
      key: 'inactive',
      label: 'Inactive (Concern)',
      count: counts.inactive,
      icon: <BanIcon size={20} />,
      accent: bgcolors.grayAccent,
      iconColor: textcolors.muted,
      countColor: textcolors.dim,
      border: borderstyles.light,
      iconBg: bgcolors.grayFaint,
    },
    {
      key: 'processing',
      label: 'Processing',
      count: counts.processing,
      icon: <RefreshIcon size={20} className='animate-spin-slow' />,
      accent: bgcolors.orangeAccent,
      iconColor: textcolors.orange,
      countColor: textcolors.orangeDark,
      border: borderstyles.orangeBorder,
      iconBg: bgcolors.orangeLight,
    },
    {
      key: 'error',
      label: 'Error (Critical)',
      count: counts.error,
      icon: <CloseCircleIcon size={20} />,
      accent: bgcolors.danger,
      iconColor: textcolors.danger,
      countColor: textcolors.dangerDark,
      border: borderstyles.dangerBorder,
      iconBg: bgcolors.dangerFaint,
    },
  ]

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
      {cards.map(card => (
        <div
          key={card.key}
          className={`relative ${bgcolors.white} rounded-xl p-3 ${card.border} shadow-sm overflow-hidden flex items-center justify-between`}
        >
          <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${card.accent}`} />
          <div className='flex items-center gap-3 pl-2'>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.iconBg}`}>
              <span className={card.iconColor}>{card.icon}</span>
            </div>
            <span className={`${textSizes.subtitle} font-semibold ${textcolors.dim}`}>{card.label}</span>
          </div>
          <span className={`text-2xl font-extrabold ${card.countColor}`}>{card.count}</span>
        </div>
      ))}
    </div>
  )
}

export default CameraStatusSummary

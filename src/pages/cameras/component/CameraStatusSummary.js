import { useMemo } from 'react'
import {
  IoWifi,
  IoBanOutline,
  IoRefresh,
  IoCloseCircleOutline
} from 'react-icons/io5'

const CameraStatusSummary = ({ cameras }) => {
  // Calculate counts dynamically based on the passed cameras
  const counts = useMemo(() => {
    const stats = { active: 0, inactive: 0, processing: 0, error: 0 }
    cameras.forEach(camera => {
      const status = camera.status?.toLowerCase() || 'inactive'
      if (stats[status] !== undefined) {
        stats[status]++
      }
    })
    return stats
  }, [cameras])

  const cards = [
    {
      key: 'active',
      label: 'Active (Good)',
      count: counts.active,
      icon: <IoWifi size={20} />,
      styles: {
        border: 'border-green-500/30',
        text: 'text-green-400',
        bg: 'bg-green-500/10' // Subtle background tint if needed, or keeping it dark
      }
    },
    {
      key: 'inactive',
      label: 'Inactive (Concern)',
      count: counts.inactive,
      icon: <IoBanOutline size={20} />,
      styles: {
        border: 'border-gray-500/30',
        text: 'text-gray-400',
        bg: 'bg-gray-500/10'
      }
    },
    {
      key: 'processing',
      label: 'Processing',
      count: counts.processing,
      icon: <IoRefresh size={20} className='animate-spin-slow' />, // Added spin for processing effect
      styles: {
        border: 'border-orange-500/30',
        text: 'text-orange-400',
        bg: 'bg-orange-500/10'
      }
    },
    {
      key: 'error',
      label: 'Error (Critical)',
      count: counts.error,
      icon: <IoCloseCircleOutline size={20} />,
      styles: {
        border: 'border-red-500/30',
        text: 'text-red-400',
        bg: 'bg-red-500/10'
      }
    }
  ]

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
      {cards.map(card => (
        <div
          key={card.key}
          className={`relative bg-[#30313F] rounded-lg p-4 border ${card.styles.border} flex items-center justify-between shadow-sm`}
        >
          {/* Left side: Icon and Label */}
          <div className='flex items-center gap-3'>
            <div className={`${card.styles.text}`}>{card.icon}</div>
            <span className={`text-sm font-medium ${card.styles.text}`}>
              {card.label}
            </span>
          </div>

          {/* Right side: Count */}
          <div className='text-2xl font-bold text-gray-200'>{card.count}</div>
        </div>
      ))}
    </div>
  )
}

export default CameraStatusSummary

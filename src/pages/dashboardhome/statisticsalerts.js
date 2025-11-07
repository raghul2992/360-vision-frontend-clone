import React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

const StatisticsChart = () => {
  const { t } = useTranslation()
  const statistics = useSelector(state => state.alerts.statistics)

  const maxValue = Math.max(...Object.values(statistics))

  const getBarWidth = value => {
    return `${(value / maxValue) * 100}%`
  }

  const barColors = {
    carros: 'bg-green-500',
    onibus: 'bg-teal-500',
    motos: 'bg-blue-500',
    caminhao: 'bg-cyan-400'
  }

  const labels = {
    carros: t('statistics.cars'),
    onibus: t('statistics.buses'),
    motos: t('statistics.motorcycles'),
    caminhao: t('statistics.trucks')
  }

  return (
    <div className='bg-[#2a2d3a] rounded-lg p-6'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <div className='flex items-center gap-2 mb-2'>
            <div className='grid grid-cols-2 gap-1'>
              <div className='w-1 h-1 bg-white'></div>
              <div className='w-1 h-1 bg-white'></div>
              <div className='w-1 h-1 bg-white'></div>
              <div className='w-1 h-1 bg-white'></div>
            </div>
            <span className='text-gray-400 text-sm'>
              {t('statistics.total_alerts')}
            </span>
          </div>
        </div>
      </div>

      <div className='space-y-6'>
        {Object.entries(statistics).map(([key, value]) => (
          <div key={key}>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-gray-300 text-sm'>{labels[key]}</span>
            </div>
            <div className='relative h-8 bg-[#1a1d29] rounded-full overflow-hidden'>
              <div
                className={`h-full ${barColors[key]} transition-all duration-500 ease-out rounded-full`}
                style={{ width: getBarWidth(value) }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className='flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-700'>
        <button className='p-2 hover:bg-[#1a1d29] rounded transition-colors'>
          <svg
            className='w-5 h-5 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
            />
          </svg>
        </button>
        <button className='p-2 hover:bg-[#1a1d29] rounded transition-colors'>
          <svg
            className='w-5 h-5 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
            />
          </svg>
        </button>
        <button className='p-2 hover:bg-[#1a1d29] rounded transition-colors'>
          <svg
            className='w-5 h-5 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            />
          </svg>
        </button>
        <button className='p-2 hover:bg-[#1a1d29] rounded transition-colors'>
          <svg
            className='w-5 h-5 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z'
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default StatisticsChart

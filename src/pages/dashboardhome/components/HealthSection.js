import React from 'react'
import { useTranslation } from 'react-i18next'
import FilterDropdown from '../../../component/FilterDropdown' // Adjust path
import HealthCard from './HealthCard'

const HealthSection = ({ healthData, filterProps }) => {
  const { t } = useTranslation()

  return (
    <>
      <div className='flex items-center justify-between mb-8'>
        <h1 className='text-white text-2xl font-semibold'>
          {t('dashboard.camera_health_overview')}
        </h1>
        {/* <div className='w-58'>
          <FilterDropdown {...filterProps} />
        </div> */}
      </div>

      <div className='bg-[#2a2f45] rounded-xl p-6 mb-8 shadow-sm'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {[
            {
              status: 'active',
              display: t('dashboard.active_good'),
              count: healthData.active,
              color: '#4CAF50'
            },
            {
              status: 'inactive',
              display: t('dashboard.inactive_concern'),
              count: healthData.inactive,
              color: '#9ca3af'
            },
            {
              status: 'processing',
              display: t('dashboard.processing'),
              count: healthData.processing,
              color: '#f97316'
            },
            {
              status: 'error',
              display: t('dashboard.error_critical'),
              count: healthData.error,
              color: '#F44336'
            }
          ].map((data, i) => (
            <HealthCard
              key={i}
              status={data.status}
              displayStatus={data.display}
              count={data.count}
              color={data.color}
            />
          ))}
        </div>
      </div>
    </>
  )
}

export default HealthSection

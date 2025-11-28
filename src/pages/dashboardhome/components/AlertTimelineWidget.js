import React from 'react'
import { useSelector } from 'react-redux'
import { LineChart } from '@mui/x-charts/LineChart'
import { useTranslation } from 'react-i18next'
import ListSkeletonLoader from '../../../component/ListSkeletonLoader'

const AlertTimelineWidget = ({ isLoading: propIsLoading }) => {
  const { t } = useTranslation()
  const { alertTimeline, error } = useSelector(state => state.widgetApi)

  const isLoading = propIsLoading // Use the independently tracked loading state

  const chartData = alertTimeline?.map(item => item.count) || []
  const xAxisData = alertTimeline?.map(item => item.time) || []

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {isLoading && (
        <div className='flex items-center justify-center h-full'>
          <ListSkeletonLoader rows={1} height='h-full' />
        </div>
      )}
      {error && (
        <p className='text-red-500'>
          {t('Error')}: {error}
        </p>
      )}
      {!isLoading && !error && alertTimeline && (
        <div style={{ width: '100%', height: '100%' }}>
          <LineChart
            series={[
              {
                data: chartData,
                color: '#3885CC',
                area: true,
                showMark: false
              }
            ]}
            xAxis={[
              {
                data: xAxisData,
                scaleType: 'band',
                tickLabelStyle: { fill: 'white' },
                axisLine: { stroke: 'white' }
              }
            ]}
            yAxis={[
              {
                tickLabelStyle: { fill: 'white' },
                axisLine: { stroke: 'white' }
              }
            ]}
            margin={{ top: 10, bottom: 30, left: 20, right: 10 }}
            slotProps={{
              legend: {
                hidden: true
              }
            }}
          />
        </div>
      )}
    </div>
  )
}

export default AlertTimelineWidget

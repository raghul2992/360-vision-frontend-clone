import React from 'react'
import { useSelector } from 'react-redux'
import { PieChart } from '@mui/x-charts/PieChart'
import { useTranslation } from 'react-i18next'

const AlertTypeBreakdownWidget = () => {
  const { t } = useTranslation()
  const { alertTypeBreakdown, isLoading, error } = useSelector(
    state => state.widgetApi
  )

  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7']

  const chartData =
    alertTypeBreakdown?.map((item, index) => ({
      id: index,
      value: item.percentage,
      label: item.label,
      color: colors[index % colors.length]
    })) || []

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {isLoading && <p>{t('Loading...')}</p>}
      {error && (
        <p>
          {t('Error')}: {error}
        </p>
      )}

      {!isLoading && !error && alertTypeBreakdown?.length > 0 && (
        <div style={{ width: '100%', height: '100%' }}>
          <PieChart
            series={[
              {
                data: chartData,
                innerRadius: 30,
                outerRadius: 100,
                paddingAngle: 5,
                cornerRadius: 5,
                startAngle: -90,
                endAngle: 270,
                highlightScope: { faded: 'global', highlighted: 'item' },
                faded: {
                  innerRadius: 30,
                  additionalRadius: -30,
                  color: 'gray'
                }
              }
            ]}
            slotProps={{
              legend: {
                labelStyle: {
                  fill: 'white'
                }
              }
            }}
            sx={{
              '& .MuiChartsLegend-mark': {
                stroke: 'none'
              }
            }}
          />
        </div>
      )}

      {!isLoading && !error && alertTypeBreakdown?.length === 0 && (
        <p style={{ color: 'white' }}>{t('No data available')}</p>
      )}
    </div>
  )
}

export default AlertTypeBreakdownWidget

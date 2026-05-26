import React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { colors, textcolors, textSizes } from '../../../theme'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import ListSkeletonLoader from '../../../component/ListSkeletonLoader'

const TopProblematicRoisWidget = ({ isLoading: propIsLoading }) => {
  const { t } = useTranslation()
  const { topProblematicRois, error } = useSelector(state => state.widgetApi)
  const isLoading = propIsLoading // external loading flag

  // Prepare data
  let chartData = []
  if (topProblematicRois && topProblematicRois.length > 0) {
    chartData = topProblematicRois.slice(0, 4).map(item => ({
      name: item.roi_name,
      AlertCount: item.alert_count
    }))
  }

  // Define Color Ranges and Legend Data
  const rangeConfig = [
    { label: '0 - 10', color: colors.emerald, max: 10 },
    { label: '11 - 30', color: colors.warning, max: 30 },
    { label: '31 - 60', color: colors.primary, max: 60 },
    { label: '> 60', color: colors.danger, max: Infinity }
  ]

  const getRangeColor = value => {
    if (value >= 0 && value <= 10) return colors.emerald
    if (value > 10 && value <= 30) return colors.warning
    if (value > 30 && value <= 60) return colors.primary
    return colors.danger
  }

  // Label styles
  const whiteTextStyle = {
    fontSize: 12,
    fill: colors.textDim,
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  }

  // Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className='p-2 rounded shadow-lg text-xs' style={{ background: colors.panel, border: `1px solid ${colors.border}`, color: colors.text }}>
          <p className='font-bold'>{label}</p>
          <p className='mt-1'>
            {t('dashboard.alerts')}: {payload[0].value}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <>
      {isLoading && (
        <div className='flex items-center justify-center h-full'>
          <ListSkeletonLoader rows={4} height='h-8' />
        </div>
      )}

      {error && (
        <p className={textcolors.danger}>
          {t('Error')}: {error}
        </p>
      )}

      {!isLoading && !error && (
        <div className='flex flex-col w-full h-full'>
          {chartData.length === 0 ? (
            <div className='flex-1 flex items-center justify-center'>
              <p className={`${textcolors.dim} ${textSizes.subtitle}`}>
                {t('dashboard.no_data_available')}
              </p>
            </div>
          ) : (
            <>
              {/* Chart Section - flex-grow ensures it takes available height */}
              <div className='flex-grow min-h-0'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 10, left: -20, bottom: 55 }}
                    className='w-full'
                  >
                    <CartesianGrid strokeDasharray='3 3' stroke={colors.border} />

                    <XAxis
                      dataKey='name'
                      tick={whiteTextStyle}
                      stroke={colors.border}
                      height={60}
                      interval={0}
                      angle={-30}
                      textAnchor='end'
                    />

                    <YAxis tick={whiteTextStyle} stroke={colors.border} />

                    <Tooltip content={<CustomTooltip />} />

                    <Bar dataKey='AlertCount' name={t('dashboard.alerts')}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getRangeColor(entry.AlertCount)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Color Indication / Legend Section */}
              <div className='flex flex-wrap items-center justify-center gap-4 mt-2 mb-1'>
                {rangeConfig.map((item, index) => (
                  <div key={index} className='flex items-center gap-2'>
                    <span
                      className='w-3 h-3 rounded-full'
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className={`text-xs ${textcolors.dim} font-medium whitespace-nowrap`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

export default TopProblematicRoisWidget

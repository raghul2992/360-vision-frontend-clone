import React, { useRef, useState, useEffect } from 'react'
import { PieChart } from '@mui/x-charts/PieChart'
import { useTranslation } from 'react-i18next'
import { colors, textcolors, textSizes } from '../../../theme'

export default function DetectionChart ({ data, total, showPercentages }) {
  const { t } = useTranslation()
  const chartRef = useRef(null)

  const [chartSize, setChartSize] = useState({ width: 300, height: 240, radius: 100, innerRadius: 20 })

  const getPriorityColor = (label, defaultColor) => {
    if (!label) return defaultColor
    const lowerLabel = label.toString().toLowerCase()
    if (lowerLabel.includes('low')) return colors.success
    if (lowerLabel.includes('medium')) return colors.warning
    if (lowerLabel.includes('high')) return colors.danger
    return defaultColor
  }

  const chartData = data.map((item, index) => ({
    id: index,
    value: item.value,
    label: item.label,
    color: getPriorityColor(item.label, item.color)
  }))

  const updateChartSize = () => {
    if (chartRef.current) {
      const parentWidth = chartRef.current.offsetWidth
      const parentHeight = chartRef.current.offsetHeight
      // Reserve 32px for legend row at top
      const availableHeight = parentHeight - 32
      const size = Math.max(Math.min(parentWidth * 0.9, availableHeight * 0.9), 150)
      const radius = Math.min(size / 2.5, 120)
      const innerRadius = Math.round(radius * 0.22)
      setChartSize({ width: parentWidth, height: availableHeight, radius, innerRadius })
    }
  }

  useEffect(() => {
    updateChartSize()
    if (chartRef.current) {
      const observer = new ResizeObserver(updateChartSize)
      observer.observe(chartRef.current)
      return () => observer.disconnect()
    }
    return () => {}
  }, [data.length])

  if (chartData.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className={`${textcolors.dim} ${textSizes.subtitle}`}>{t('No data available')}</p>
      </div>
    )
  }

  return (
    <div ref={chartRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>

      {/* Legend at top */}
      {chartData.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 16px', marginBottom: 8 }}>
          {chartData.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chart — MUI built-in legend fully hidden via sx */}
      <PieChart
        series={[{ data: chartData, innerRadius: chartSize.innerRadius, outerRadius: chartSize.radius, paddingAngle: 1.5, cornerRadius: 4 }]}
        width={chartSize.width}
        height={chartSize.height}
        slotProps={{ legend: { hidden: true } }}
        sx={{ '& .MuiChartsLegend-root': { display: 'none' } }}
        margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
      />
    </div>
  )
}

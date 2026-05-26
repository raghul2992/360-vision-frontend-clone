import React, { useRef, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { PieChart } from '@mui/x-charts/PieChart'
import { useTranslation } from 'react-i18next'
import { colors, textcolors, textSizes } from '../../../theme'

const CHART_COLORS = [colors.danger, colors.warning, colors.emerald, colors.primary, colors.purple]
const LEGEND_WIDTH = 200   // legend column width on desktop
const LEGEND_TOP_H = 60    // approximate legend-row height on mobile

const AlertTypeBreakdownWidget = () => {
  const { t } = useTranslation()
  const wrapperRef = useRef(null)
  const [chartSize, setChartSize] = useState({ width: 300, height: 260 })

  const { alertTypeBreakdown, isLoading, error } = useSelector(
    state => state.widgetApi
  )

  const cleanLabel = (raw) => {
    if (!raw) return ''
    return raw
      .replace(/^\["|"\]$/g, '')
      .replace(/^\["?|"?\]$/g, '')
      .replace(/\bPpe\b/g, 'PPE')
      .trim()
  }

  const chartData =
    alertTypeBreakdown?.map((item, index) => ({
      id: index,
      value: item.percentage,
      label: cleanLabel(item.label),
      color: CHART_COLORS[index % CHART_COLORS.length]
    })) || []

  useEffect(() => {
    const updateSize = () => {
      if (wrapperRef.current) {
        const w = wrapperRef.current.offsetWidth
        const h = wrapperRef.current.offsetHeight
        setChartSize({ width: w, height: h })
      }
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    if (wrapperRef.current) observer.observe(wrapperRef.current)
    return () => observer.disconnect()
  }, [])

  const isNarrow = chartSize.width > 0 && chartSize.width < 400

  if (isNarrow) {
    /* ── MOBILE: legend top, smaller chart below ── */
    const chartW = chartSize.width
    const chartH = Math.max(chartSize.height - LEGEND_TOP_H, 100)
    const outerRadius = Math.min(120, chartW / 2.4, chartH / 2.4)
    const innerRadius = Math.round(outerRadius * 0.22)

    return (
      <div ref={wrapperRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {isLoading && <p style={{ color: colors.textDim }}>{t('Loading...')}</p>}
        {error && <p style={{ color: colors.danger }}>{t('Error')}: {error}</p>}

        {!isLoading && !error && chartData.length > 0 && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 12px', marginBottom: 6 }}>
              {chartData.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: colors.text, whiteSpace: 'nowrap' }}>{item.label}</span>
                </div>
              ))}
            </div>
            <PieChart
              width={chartW}
              height={chartH}
              series={[{
                data: chartData,
                valueFormatter: (v) => `${(v.value * 100).toFixed(1)}%`,
                innerRadius,
                outerRadius,
                paddingAngle: 5,
                cornerRadius: 5,
                startAngle: -90,
                endAngle: 270,
                highlightScope: { faded: 'global', highlighted: 'item' },
                faded: { innerRadius, additionalRadius: -innerRadius, color: colors.chartFade }
              }]}
              slotProps={{ legend: { hidden: true } }}
              sx={{ '& .MuiChartsLegend-root': { display: 'none' } }}
              margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
            />
          </>
        )}

        {!isLoading && !error && alertTypeBreakdown?.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <p className={`${textcolors.dim} ${textSizes.subtitle}`}>{t('No data available')}</p>
          </div>
        )}
      </div>
    )
  }

  /* ── DESKTOP: chart left, legend right ── */
  const chartW = Math.max(chartSize.width - LEGEND_WIDTH, 100)
  const outerRadius = Math.min(120, chartW / 2.4)
  const innerRadius = Math.round(outerRadius * 0.22)
  // limit chart height to the donut diameter so no vertical gap
  const chartH = Math.min(chartSize.height, outerRadius * 2 + 20)

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {isLoading && <p style={{ color: colors.textDim }}>{t('Loading...')}</p>}
      {error && <p style={{ color: colors.danger }}>{t('Error')}: {error}</p>}

      {!isLoading && !error && chartData.length > 0 && (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          {/* Chart */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PieChart
              width={chartW}
              height={chartH}
              series={[{
                data: chartData,
                valueFormatter: (v) => `${(v.value * 100).toFixed(1)}%`,
                innerRadius,
                outerRadius,
                paddingAngle: 5,
                cornerRadius: 5,
                startAngle: -90,
                endAngle: 270,
                highlightScope: { faded: 'global', highlighted: 'item' },
                faded: { innerRadius, additionalRadius: -innerRadius, color: colors.chartFade }
              }]}
              slotProps={{ legend: { hidden: true } }}
              sx={{ '& .MuiChartsLegend-root': { display: 'none' } }}
              margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
            />
          </div>

          {/* Legend */}
          <div style={{ flexShrink: 0, width: LEGEND_WIDTH - (-30), display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 0 }}>
            {chartData.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: colors.text, lineHeight: '1.3' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !error && alertTypeBreakdown?.length === 0 && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className={`${textcolors.dim} ${textSizes.subtitle}`}>{t('No data available')}</p>
        </div>
      )}
    </div>
  )
}

export default AlertTypeBreakdownWidget

import React, { useRef, useState, useEffect } from 'react'
import { PieChart } from '@mui/x-charts/PieChart'
import { useTranslation } from 'react-i18next'

export default function DetectionChart ({ data, total, showPercentages }) {
  const { t } = useTranslation()
  const chartRef = useRef(null)

  const [chartSize, setChartSize] = useState({
    width: 300,
    height: 300,
    radius: 100,
    innerRadius: 20
  })

  // Helper function to assign colors based on Priority
  const getPriorityColor = (label, defaultColor) => {
    if (!label) return defaultColor
    const lowerLabel = label.toString().toLowerCase()

    // Check for keywords and return specific colors
    if (lowerLabel.includes('low')) return '#4CAF50' // Green
    if (lowerLabel.includes('medium')) return '#FFC107' // Yellow (Amber for better visibility)
    if (lowerLabel.includes('high')) return '#F44336' // Red

    return defaultColor
  }

  // Transform your incoming data to match MUI PieChart format
  const chartData = data.map((item, index) => ({
    id: index,
    value: item.value,
    label: item.label,
    // Override color if it matches priority keywords, otherwise use item.color
    color: getPriorityColor(item.label, item.color)
  }))

  // Function to calculate and set the chart size
  const updateChartSize = () => {
    if (chartRef.current) {
      const parentWidth = chartRef.current.offsetWidth
      const parentHeight = chartRef.current.offsetHeight
      const availableHeight = parentHeight - 50

      const chartDimension = Math.min(
        showPercentages ? parentWidth * 0.7 : parentWidth * 0.9,
        availableHeight * 0.9
      )

      const size = Math.max(chartDimension, 150)
      const radius = size / 2.5
      const innerRadius = radius * 0.2

      setChartSize({
        width: parentWidth,
        height: parentHeight,
        radius: radius,
        innerRadius: innerRadius
      })
    }
  }

  useEffect(() => {
    updateChartSize()
    if (chartRef.current) {
      const observer = new ResizeObserver(() => updateChartSize())
      observer.observe(chartRef.current)
      return () => observer.disconnect()
    }
    return () => {}
  }, [showPercentages, data.length])

  const pieChartProps = {
    series: [
      {
        data: chartData,
        innerRadius: chartSize.innerRadius,
        outerRadius: chartSize.radius,
        paddingAngle: 1.5,
        cornerRadius: 4
      }
    ],
    width: chartSize.width,
    height: chartSize.height,
    slotProps: {
      legend: {
        hidden: !showPercentages,
        direction: 'column',
        itemMarkWidth: 10,
        itemMarkHeight: 10
      }
    },
    margin: showPercentages
      ? { top: 0, bottom: 0, left: 0, right: 0 }
      : undefined
  }

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '40px'
      }}
    >
      <PieChart {...pieChartProps} />
    </div>
  )
}

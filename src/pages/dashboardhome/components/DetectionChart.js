import React, { useRef, useState, useEffect } from 'react'
import { PieChart } from '@mui/x-charts/PieChart'
import { useTranslation } from 'react-i18next'

export default function DetectionChart ({ data, total, showPercentages }) {
  const { t } = useTranslation()
  const chartRef = useRef(null)
  // Initialize with a default size, will be updated on mount/resize
  const [chartSize, setChartSize] = useState({
    width: 300,
    height: 300,
    radius: 100,
    innerRadius: 20
  })

  // Transform your incoming data to match MUI PieChart format
  const chartData = data.map((item, index) => ({
    id: index,
    value: item.value,
    label: item.label,
    color: item.color
  }))

  // Function to calculate and set the chart size
  const updateChartSize = () => {
    if (chartRef.current) {
      // Get the current dimensions of the chart container
      const parentWidth = chartRef.current.offsetWidth
      const parentHeight = chartRef.current.offsetHeight

      // Determine the max size for the chart circle to fit within the container
      // Subtract space for the total text below and margin.
      const availableHeight = parentHeight - 50

      // Calculate a size based on the smaller dimension (to keep it square)
      // If legend is visible, the chart needs to be smaller than the width.
      const chartDimension = Math.min(
        showPercentages ? parentWidth * 0.7 : parentWidth * 0.9,
        availableHeight * 0.9
      )

      // Ensure minimum size
      const size = Math.max(chartDimension, 150)

      // Calculate radii for the PieChart
      const radius = size / 2.5 // Outer radius
      const innerRadius = radius * 0.2 // Inner radius (20% of outer)

      setChartSize({
        width: parentWidth,
        height: parentHeight,
        radius: radius,
        innerRadius: innerRadius
      })
    }
  }

  // Hook to handle resize events using ResizeObserver
  useEffect(() => {
    updateChartSize()

    // Use ResizeObserver to detect when the div changes size (due to RGL drag/resize)
    if (chartRef.current) {
      const observer = new ResizeObserver(() => updateChartSize())
      observer.observe(chartRef.current)
      return () => observer.disconnect()
    }
    // Fallback if needed, but ResizeObserver is preferred for RGL context
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
    // Use full parent dimensions
    width: chartSize.width,
    height: chartSize.height,
    slotProps: {
      legend: {
        hidden: !showPercentages, // Hide legend if not showing percentages (Default for DetectionType)
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
      // Style the container to take up all available space
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '40px' // Ensure a minimum visible size
      }}
    >
      <PieChart {...pieChartProps} />

      {/* Total Label: Positioned to be below the chart */}
    </div>
  )
}

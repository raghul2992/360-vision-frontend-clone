import React from 'react'
import { PieChart } from '@mui/x-charts/PieChart'

export default function DetectionChart ({ title, data, total, label }) {
  // Transform your incoming data to match MUI PieChart format
  const chartData = data.map((item, index) => ({
    id: index,
    value: item.value,
    label: item.label,
    color: item.color
  }))

  return (
    <div
      style={{
        // backgroundColor: '#30313F',
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'center'
        // borderColor:''
      }}
      className='border-[#FFF] border-[1px]'
    >
      {/* Chart Title */}
      <h3 style={{ color: '#E0E0E0', marginBottom: '12px' }}>{title}</h3>

      {/* Chart Container */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <PieChart
          series={[
            {
              data: chartData,
              innerRadius: 20,
              outerRadius: 100,
              paddingAngle: 4,
              cornerRadius: 4
            }
          ]}
          width={250}
          height={250}
          slotProps={{
            legend: { hidden: true }
          }}
        />

        {/* Center Label */}
        <div
          style={{
            color: '#E0E0E0',
            textAlign: 'center'
          }}
        >
          <p style={{ color: '#FFF', margin: 0 }}>Total: {total}</p>
        </div>
      </div>
    </div>
  )
}

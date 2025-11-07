// components/HealthCard.jsx
import React from 'react'
import { Card, CardContent, Typography } from '@mui/material'
import {
  IoWifiOutline,
  IoBan,
  IoCloseCircle,
  IoRefreshCircleOutline
} from 'react-icons/io5'
import { FaCircleNotch } from 'react-icons/fa'

export default function HealthCard ({ status, displayStatus, count, color }) {
  const getStatusIcon = status => {
    switch (status) {
      case 'active':
        return (
          <div className='w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30'>
            <IoWifiOutline className='text-green-400' size={24} />
          </div>
        )
      case 'inactive':
        return (
          <div className='w-12 h-12 rounded-xl bg-gray-500/20 flex items-center justify-center border border-gray-500/30'>
            <IoBan className='text-gray-400' size={24} />
          </div>
        )
      case 'processing':
        return (
          <div className='w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30'>
            <IoRefreshCircleOutline className='text-orange-500 ' size={30} />
          </div>
        )
      case 'error':
        return (
          <div className='w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30'>
            <IoCloseCircle className='text-red-400' size={24} />
          </div>
        )
      default:
        return (
          <div className='w-12 h-12 rounded-xl bg-gray-500/20 flex items-center justify-center border border-gray-500/30'>
            <IoWifiOutline className='text-gray-400' size={24} />
          </div>
        )
    }
  }

  const cardStyle = {
    backgroundColor: '#2E2E2E',
    border: `1px solid ${color}`,
    borderRadius: '12px',
    boxShadow: `0 0 10px 0 ${color}40`,
    transition: 'transform 0.3s, box-shadow 0.3s',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: `0 8px 15px 0 ${color}60`
    },
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    p: 2
  }

  return (
    <Card sx={cardStyle}>
      <CardContent
        sx={{
          p: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center', // 👈 Even vertical spacing
          alignItems: 'center'
        }}
      >
        {getStatusIcon(status)}
        <Typography
          variant='subtitle1'
          style={{ margin: '10px 0' }}
          color='#A0A0A0'
        >
          {displayStatus}
        </Typography>
        <Typography variant='h4' color='#E0E0E0' fontWeight='bold'>
          {count}
        </Typography>
      </CardContent>
    </Card>
  )
}

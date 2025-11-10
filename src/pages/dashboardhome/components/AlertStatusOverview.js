import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { CardContent, Typography, Box, LinearProgress } from '@mui/material'
import { useTranslation } from 'react-i18next'
import {
  fetchAlerts,
  fetchStatusCountAlerts
} from '../../../features/alert/alertSlice'

export default function AlertStatusOverview () {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { statusCounts, isLoading, error, lastFetched } = useSelector(
    state => state.alerts
  )

  useEffect(() => {
    const tenantId = localStorage.getItem('tenant_id')
    if (!tenantId) return

    dispatch(
      fetchStatusCountAlerts({
        tenantId,
        queryParams: {}
      })
    )
    console.log('1', statusCounts)
    console.log('check', isLoading, lastFetched)
  }, [dispatch])

  const readCount = statusCounts.read
  const unreadCount = statusCounts.unread
  const totalCount = readCount + unreadCount

  const triageData = [
    { label: t('alerts.read'), count: readCount, color: '#4CAF50' },
    { label: t('alerts.unread'), count: unreadCount, color: '#FF9800' }
  ]

  const StyledLinearProgress = ({ value, color }) => (
    <LinearProgress
      variant='determinate'
      value={value}
      sx={{
        height: 8,
        borderRadius: 5,
        backgroundColor: '#404040',
        '& .MuiLinearProgress-bar': { backgroundColor: color }
      }}
    />
  )

  return (
    <div
      style={{ borderRadius: '12px', padding: '16px', textAlign: 'center' }}
      className='border-[#FFF] border-[1px]'
    >
      <CardContent>
        <Typography variant='h6' color='#E0E0E0' gutterBottom>
          {t('alerts.alert_status')}
        </Typography>

        {triageData.map((item, index) => {
          const percentage =
            totalCount > 0 ? (item.count / totalCount) * 100 : 0
          return (
            <Box key={index} sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5
                }}
              >
                <Typography variant='body1' color='#A0A0A0'>
                  {item.label}
                </Typography>
                <Typography variant='body1' color='#E0E0E0' fontWeight='bold'>
                  {item.count}
                </Typography>
              </Box>
              <StyledLinearProgress value={percentage} color={item.color} />
            </Box>
          )
        })}

        {isLoading && (
          <Typography variant='body2' color='#A0A0A0' textAlign='center'>
            {t('alerts.loading_alerts')}
          </Typography>
        )}
        {error && (
          <Typography variant='body2' color='error' textAlign='center'>
            {t('alerts.error_loading_alerts', { error })}
          </Typography>
        )}
      </CardContent>
    </div>
  )
}

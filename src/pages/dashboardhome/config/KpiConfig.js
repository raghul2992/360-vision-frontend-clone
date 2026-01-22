import React from 'react'
import { FiCircle } from 'react-icons/fi'

export const KPI_WIDGETS_CONFIG = [
  {
    id: 'total_alerts',
    titleKey: 'dashboard.kpi.total_alerts',
    descriptionKey: 'dashboard.kpi.total_alerts_desc',
    // Function to extract data
    getValue: data => data?.alertsCount ?? 0,
    getSubText: (data, t) => t('dashboard.kpi.last_7_days'),
    subClass: 'text-gray-500'
  },
  {
    id: 'most_frequent',
    titleKey: 'dashboard.kpi.most_frequent',
    descriptionKey: 'dashboard.kpi.most_frequent_desc',
    getValue: data => data?.mostFrequent?.detection_type || 'N/A',
    getSubText: (data, t) =>
      `${data?.mostFrequent?.count ?? 0} ${t('dashboard.kpi.occurrences')}`,
    subClass: 'text-gray-400'
  },
  {
    id: 'busiest_hour',
    titleKey: 'dashboard.kpi.busiest_hour',
    descriptionKey: 'dashboard.kpi.busiest_hour_desc',
    getValue: data =>
      data?.busiestHour?.time_start_utc
        ? data.busiestHour.time_start_utc.slice(11, 16)
        : '--:--',
    getSubText: (data, t) =>
      `${data?.busiestHour?.count ?? 0} ${t('dashboard.kpi.alerts')}`,
    subClass: 'text-gray-400'
  },
  {
    id: 'dwell_time',
    titleKey: 'dashboard.kpi.avg_dwell',
    descriptionKey: 'dashboard.kpi.avg_dwell_desc',
    getValue: data => data?.avgDwell?.average_dwell_time || '00m 00s',
    getSubText: (data, t) => t('dashboard.kpi.avg_duration'),
    subClass: 'text-gray-400'
  },
  {
    id: 'camera_status',
    titleKey: 'dashboard.kpi.camera_status',
    descriptionKey: 'dashboard.kpi.camera_status_desc',
    getValue: data => `${data?.activeCameras ?? 0}/${data?.totalCameras ?? 0}`,
    getSubText: (data, t) => t('dashboard.kpi.live'),
    subIcon: (
      <FiCircle
        size={10}
        className='fill-green-500 text-green-500 animate-pulse'
      />
    ),
    subClass: 'text-green-500'
  }
]

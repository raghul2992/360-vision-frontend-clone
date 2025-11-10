import React, { useState, useEffect, useCallback } from 'react'
import Select from 'react-select'
import { useDispatch, useSelector } from 'react-redux'
import 'react-datepicker/dist/react-datepicker.css'
import DatePicker from 'react-datepicker'
import format from 'date-fns/format'
import { useTranslation } from 'react-i18next'

// --- Redux Thunks ---
import { getCameras } from '../../features/cameras/cameraApiSlice'
import { getLocations } from '../../features/locations/locationApiSlice'
import { fetchAlerts } from '../../features/alert/alertSlice'

// --- Custom Components ---
import DetectionChart from '../dashboardhome/components/DetectionChart'
import HealthCard from '../dashboardhome/components/HealthCard'

// --- React Select Custom Styles ---
const customStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: '#393A4A',
    borderRadius: '9999px',
    border: state.isFocused ? '1px solid #6366F1' : '1px solid #4B5563',
    boxShadow: 'none',
    color: '#E0E0E0',
    padding: '2px 6px',
    cursor: 'pointer',
    minHeight: '38px'
  }),
  menu: base => ({
    ...base,
    backgroundColor: '#2a2f45',
    color: '#FFFFFF',
    borderRadius: '8px',
    marginTop: '4px',
    zIndex: 9999
  }),
  menuList: base => ({ ...base, color: '#E0E0E0' }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    backgroundColor: isSelected
      ? '#6366F1'
      : isFocused
      ? '#3B3F58'
      : 'transparent',
    color: isSelected ? '#fff' : '#E0E0E0',
    cursor: 'pointer'
  }),
  singleValue: base => ({ ...base, color: '#FFFFFF', fontWeight: 500 }),
  placeholder: base => ({ ...base, color: '#A5ADC9', fontWeight: 400 }),
  input: base => ({ ...base, color: '#FFFFFF' })
}

export default function DashboardOverview () {
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const { locations = [] } = useSelector(state => state.locationApi || {})
  const { cameras = [], isLoading } = useSelector(
    state => state.cameraApi || {}
  )
  const { alerts = [] } = useSelector(state => state.alerts || {})

  // --- Independent Filters ---
  const [healthLocation, setHealthLocation] = useState(null)
  const [selectedCamera, setSelectedCamera] = useState(null)

  const [detectionLocation, setDetectionLocation] = useState(null)
  const [detectionCamera, setDetectionCamera] = useState(null)

  const today = new Date()
  const [dateRange, setDateRange] = useState([today, today])
  const [startDate, endDate] = dateRange || []

  // --- Data State ---
  const [healthData, setHealthData] = useState({
    active: 0,
    inactive: 0,
    processing: 0,
    error: 0
  })
  const [detectionData, setDetectionData] = useState([])
  const [priorityData, setPriorityData] = useState([])
  const [totalDetection, setTotalDetection] = useState(0)
  const [totalAlerts, setTotalAlerts] = useState(0)

  // ✅ Fetch locations on mount
  useEffect(() => {
    const tenant_id = localStorage.getItem('tenant_id')
    if (tenant_id) dispatch(getLocations(tenant_id))
  }, [dispatch])

  // ✅ Fetch cameras
  const fetchCameras = useCallback(() => {
    const tenantId = localStorage.getItem('tenant_id')
    if (!tenantId) return
    dispatch(getCameras({ tenantId, skip: 0, limit: 100 }))
  }, [dispatch])

  useEffect(() => {
    fetchCameras()
  }, [fetchCameras])

  // ✅ Fetch alerts whenever filters change (date/location/camera)
  useEffect(() => {
    const tenantId = localStorage.getItem('tenant_id')
    if (!tenantId) return

    // normalize dates
    const [start, end] = dateRange || []

    const isDateCleared =
      !start ||
      !end ||
      !(start instanceof Date) ||
      !(end instanceof Date) ||
      isNaN(start) ||
      isNaN(end)

    const queryParams = {
      type: 'event_alert',
      skip: 0,
      limit: 100
    }

    // add filters
    if (!isDateCleared) {
      queryParams.created_after = format(start, "yyyy-MM-dd'T'00:00:00")
      queryParams.created_before = format(end, "yyyy-MM-dd'T'23:59:59")
    }

    if (detectionLocation?.value)
      queryParams.location_id = detectionLocation.value
    if (detectionCamera?.value) queryParams.camera_id = detectionCamera.value

    dispatch(fetchAlerts({ tenantId, queryParams }))
  }, [dateRange, detectionLocation, detectionCamera, dispatch])

  // ✅ Reset chart data when alerts empty
  useEffect(() => {
    if (alerts.length === 0) {
      setDetectionData([])
      setPriorityData([])
      setTotalDetection(0)
      setTotalAlerts(0)
    }
  }, [alerts])

  // --- Compute Health Data ---
  useEffect(() => {
    if (cameras.length > 0 && !isLoading) {
      const filtered = cameras.filter(c => {
        const locationMatch =
          !healthLocation || c.location_id === healthLocation.value
        const cameraMatch = !selectedCamera || c.id === selectedCamera.value
        return locationMatch && cameraMatch
      })

      const active = filtered.filter(c => c.status === 'active').length
      const inactive = filtered.filter(c => c.status === 'inactive').length
      const processing = filtered.filter(c => c.status === 'processing').length
      const error = filtered.filter(c => c.status === 'error').length

      setHealthData({ active, inactive, processing, error })
    } else {
      setHealthData({ active: 0, inactive: 0, processing: 0, error: 0 })
    }
  }, [cameras, healthLocation, selectedCamera, isLoading])

  // --- Compute Detection Chart Data ---
  useEffect(() => {
    if (cameras.length > 0 && !isLoading) {
      const detections = {}
      const priorities = {}

      const filtered = cameras.filter(cam => {
        const locMatch =
          !detectionLocation || cam.location_id === detectionLocation.value
        const camMatch = !detectionCamera || cam.id === detectionCamera.value
        return locMatch && camMatch
      })

      filtered.forEach(cam => {
        cam.rois?.forEach(roi => {
          if (roi.detection_type) {
            detections[roi.detection_type] =
              (detections[roi.detection_type] || 0) + 1
          }
          if (roi.alert_priority) {
            priorities[roi.alert_priority] =
              (priorities[roi.alert_priority] || 0) + 1
          }
        })
      })

      setDetectionData(
        Object.entries(detections).map(([k, v], i) => ({
          id: i,
          value: v,
          label: k,
          color: ['#34C759', '#00C7BE', '#32ADE6', '#FF9800'][i % 4]
        }))
      )

      setPriorityData(
        Object.entries(priorities).map(([k, v], i) => ({
          id: i,
          value: v,
          label: k.charAt(0).toUpperCase() + k.slice(1),
          color: ['#ef4444', '#facc15', '#4ade80'][i % 3]
        }))
      )

      setTotalDetection(Object.values(detections).reduce((a, b) => a + b, 0))
      setTotalAlerts(Object.values(priorities).reduce((a, b) => a + b, 0))
    } else {
      setDetectionData([])
      setPriorityData([])
      setTotalDetection(0)
      setTotalAlerts(0)
    }
  }, [cameras, detectionLocation, detectionCamera, isLoading])

  const locationOptions = locations.map(loc => ({
    value: loc.id || loc._id,
    label: loc.name
  }))

  const detectionCameraOptions = cameras
    .filter(
      cam => !detectionLocation || cam.location_id === detectionLocation.value
    )
    .map(cam => ({ value: cam.id, label: cam.name }))

  const healthCameraOptions = cameras
    .filter(cam => !healthLocation || cam.location_id === healthLocation.value)
    .map(cam => ({ value: cam.id, label: cam.name }))

  return (
    <div className='min-h-screen bg-[#1a1d29] p-6 w-full'>
      <div className='mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <h1 className='text-white text-2xl font-semibold'>
            {t('dashboard.camera_health_overview')}
          </h1>
          <div className='flex gap-4'>
            <div className='w-58'>
              <Select
                options={locationOptions}
                value={healthLocation}
                onChange={opt => setHealthLocation(opt)}
                placeholder={t('dashboard.select_location')}
                isClearable
                styles={customStyles}
              />
            </div>
          </div>
        </div>

        {/* Health Cards */}
        <div className='bg-[#2a2f45] rounded-lg p-6 mb-6'>
          <div className='flex justify-between gap-4 flex-wrap'>
            {[
              {
                status: 'active',
                displayStatus: t('dashboard.active_good'),
                count: healthData.active,
                color: '#4CAF50'
              },
              {
                status: 'inactive',
                displayStatus: t('dashboard.inactive_concern'),
                count: healthData.inactive,
                color: '#9ca3af'
              },
              {
                status: 'processing',
                displayStatus: t('dashboard.processing'),
                count: healthData.processing,
                color: '#f97316'
              },
              {
                status: 'error',
                displayStatus: t('dashboard.error_critical'),
                count: healthData.error,
                color: '#F44336'
              }
            ].map((data, i) => (
              <div key={i} className='flex-1 min-w-[200px]'>
                <HealthCard {...data} />
              </div>
            ))}
          </div>
        </div>

        {/* Detection Charts */}
        <div className='bg-[#2a2f45] rounded-lg p-6'>
          <div className='flex gap-4 mb-6 flex-wrap'>
            <div className='w-58'>
              <Select
                options={locationOptions}
                value={detectionLocation}
                onChange={opt => setDetectionLocation(opt)}
                placeholder={t('dashboard.select_location')}
                isClearable
                styles={customStyles}
              />
            </div>

            {detectionLocation && (
              <div className='w-58'>
                <Select
                  options={detectionCameraOptions}
                  value={detectionCamera}
                  onChange={opt => setDetectionCamera(opt)}
                  placeholder={t('dashboard.select_camera')}
                  isClearable
                  styles={customStyles}
                />
              </div>
            )}

            <div className='w-64'>
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={update => setDateRange(update)}
                isClearable
                placeholderText={t('alerts.select_date_range')}
                className='w-full px-6 py-2 rounded-full bg-[#393A4A] text-white placeholder-[#A0AEC0] focus:outline-none focus:ring-1 focus:ring-[#6366F1]'
              />
            </div>
          </div>

          {/* Charts */}
          <div
            className='grid gap-6'
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))'
            }}
          >
            <DetectionChart
              title={t('dashboard.detection_type_breakdown')}
              data={detectionData}
              total={totalDetection}
            />
            <DetectionChart
              title={t('dashboard.alert_priority_breakdown')}
              data={priorityData}
              total={totalAlerts}
              showPercentages
            />
          </div>
        </div>
      </div>
    </div>
  )
}

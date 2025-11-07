import React, { useState, useEffect, useCallback } from 'react'
import Select from 'react-select'
import { useDispatch, useSelector } from 'react-redux'
import 'react-datepicker/dist/react-datepicker.css'

// --- Import Custom Components ---
import DetectionChart from '../dashboardhome/components/DetectionChart'
import HealthCard from '../dashboardhome/components/HealthCard'
import { getCameras } from '../../features/cameras/cameraApiSlice'
import { getLocations } from '../../features/locations/locationApiSlice'

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

  const { locations = [] } = useSelector(state => state.locationApi || {})
  const { cameras = [], isLoading } = useSelector(
    state => state.cameraApi || {}
  )

  // --- Health Card Filters ---
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [selectedCamera, setSelectedCamera] = useState(null)

  // --- Detection Chart Filters (Separate) ---
  const [detectionLocation, setDetectionLocation] = useState(null)
  const [detectionCamera, setDetectionCamera] = useState(null)

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

  // --- Fetch Locations on mount ---
  useEffect(() => {
    const tenant_id = localStorage.getItem('tenant_id')
    dispatch(getLocations(tenant_id))
  }, [dispatch])

  // --- Fetch Cameras by Location for Health ---
  const fetchCamerasByLocation = useCallback(() => {
    if (selectedLocation) {
      dispatch(
        getCameras({
          tenantId: localStorage.getItem('tenant_id'),
          location_id: selectedLocation.value,
          skip: 0,
          limit: 100
        })
      )
    } else {
      dispatch(
        getCameras({
          tenantId: localStorage.getItem('tenant_id'),
          skip: 0,
          limit: 100
        })
      )
    }
  }, [dispatch, selectedLocation])

  useEffect(() => {
    fetchCamerasByLocation()
    setSelectedCamera(null)
  }, [fetchCamerasByLocation])

  // --- Update Health Data ---
  useEffect(() => {
    if (cameras.length > 0 && !isLoading) {
      const filteredCameras = cameras.filter(camera => {
        const locationMatch =
          !selectedLocation || camera.location_id === selectedLocation.value
        const cameraMatch =
          !selectedCamera || camera.id === selectedCamera.value
        return locationMatch && cameraMatch
      })

      const active = filteredCameras.filter(c => c.status === 'active').length
      const inactive = filteredCameras.filter(
        c => c.status === 'inactive'
      ).length
      const processing = filteredCameras.filter(
        c => c.status === 'processing'
      ).length
      const error = filteredCameras.filter(c => c.status === 'error').length

      setHealthData({ active, inactive, processing, error })
    } else {
      setHealthData({ active: 0, inactive: 0, processing: 0, error: 0 })
    }
  }, [cameras, selectedLocation, selectedCamera, isLoading])

  // --- Update Detection & Priority Data (Filtered Separately) ---
  useEffect(() => {
    if (cameras.length > 0 && !isLoading) {
      let detections = {}
      let priorities = {}

      const filteredCameras = cameras.filter(camera => {
        const locationMatch =
          !detectionLocation || camera.location_id === detectionLocation.value
        const cameraMatch =
          !detectionCamera || camera.id === detectionCamera.value
        return locationMatch && cameraMatch
      })

      filteredCameras.forEach(cam => {
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
        Object.entries(detections).map(([key, value], index) => ({
          id: index,
          value,
          label: key,
          color: ['#34C759', '#00C7BE', '#32ADE6', '#FF9800'][index % 4]
        }))
      )

      setPriorityData(
        Object.entries(priorities).map(([key, value], index) => ({
          id: index,
          value,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          color: ['#ef4444', '#facc15', '#4ade80'][index % 3]
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

  const cameraOptions = cameras
    .filter(
      cam => !detectionLocation || cam.location_id === detectionLocation.value
    )
    .map(cam => ({
      value: cam.id,
      label: cam.name
    }))

  return (
    <div className='min-h-screen bg-[#1a1d29] p-6 w-full'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <h1 className='text-white text-2xl font-semibold'>
            Camera Health Overview
          </h1>
          <div className='w-58'>
            <Select
              options={locationOptions}
              value={selectedLocation}
              onChange={opt => setSelectedLocation(opt)}
              placeholder='Select Location'
              isClearable
              styles={customStyles}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Health Cards */}
        <div className='bg-[#2a2f45] rounded-lg p-6 mb-6'>
          <div className='flex justify-between gap-4 flex-wrap'>
            {[
              {
                status: 'active',
                displayStatus: 'Active (Good)',
                count: healthData.active,
                color: '#4CAF50'
              },
              {
                status: 'inactive',
                displayStatus: 'Inactive (Concern)',
                count: healthData.inactive,
                color: '#9ca3af'
              },
              {
                status: 'processing',
                displayStatus: 'processing',
                count: healthData.processing,
                color: '#f97316'
              },
              {
                status: 'error',
                displayStatus: 'error (Critical)',
                count: healthData.error,
                color: '#F44336'
              }
            ].map((data, index) => (
              <div key={index} className='flex-1 items-center min-w-[200px]'>
                <HealthCard {...data} />
              </div>
            ))}
          </div>
        </div>

        {/* Detection Charts */}
        <div className='bg-[#2a2f45] rounded-lg p-6'>
          {/* Detection Filters */}
          <div className='flex gap-4 mb-6 flex-wrap'>
            <div className='w-58'>
              <Select
                options={locationOptions}
                value={detectionLocation}
                onChange={opt => setDetectionLocation(opt)}
                placeholder='Select Location'
                isClearable
                styles={customStyles}
                isLoading={isLoading}
              />
            </div>
            <div className='w-58'>
              <Select
                options={cameraOptions}
                value={detectionCamera}
                onChange={opt => setDetectionCamera(opt)}
                placeholder={'Select Camera'}
                isClearable
                isDisabled={!detectionLocation}
                className={`${!detectionLocation && 'hidden'}`}
                styles={customStyles}
                isLoading={isLoading}
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
              title='Detection Type Breakdown'
              data={detectionData}
              total={totalDetection}
            />
            <DetectionChart
              title='Alert Priority Breakdown'
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

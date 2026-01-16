import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import AlertItem from './alertlist'
import {
  fetchAlerts,
  resetAlerts,
  setFilters
} from '../../features/alert/alertSlice'
import { getLocations } from '../../features/locations/locationApiSlice'
import { getCameras } from '../../features/cameras/cameraApiSlice'
// Import user API action for fetching assigned locations
import { fetchTenantsUsers } from '../../features/userManagement/userApiSlice'
import Select from 'react-select'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import format from 'date-fns/format'
import { useTranslation } from 'react-i18next'

const Alerts = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  // 1. Get User Info from LocalStorage
  const tenant_id = localStorage.getItem('tenant_id')
  const userRole = localStorage.getItem('user_role')
  const userId = localStorage.getItem('user_id')

  const { alerts, isLoading, error } = useSelector(state => state.alerts)
  const locations = useSelector(state => state.locationApi.locations)
  const cameras = useSelector(state => state.cameraApi.cameras)

  // Filters
  const [priorityFilter, setPriorityFilter] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [selectedCamera, setSelectedCamera] = useState(null)
  const [readStatus, setReadStatus] = useState(null)
  const [dateRange, setDateRange] = useState([null, null])
  const [startDate, endDate] = dateRange

  // Pagination
  const [limit] = useState(10)
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  // Refs
  const observerRef = useRef(null)
  const loaderRef = useRef(null)
  const containerRef = useRef(null)

  // 2. State for Viewer's Assigned Location IDs
  const [assignedLocationIds, setAssignedLocationIds] = useState([])

  // 3. Fetch Assigned Locations (Only if Viewer)
  useEffect(() => {
    if (userRole === 'viewer' && userId && tenant_id) {
      dispatch(fetchTenantsUsers({ tenant_id, user_id: userId }))
        .unwrap()
        .then(usersData => {
          const currentUser =
            usersData.find(u => String(u.id) === String(userId)) || usersData[0]
          setAssignedLocationIds(currentUser?.meta?.assign_locations || [])
        })
        .catch(err => {
          console.error('Failed to load viewer locations', err)
          setAssignedLocationIds([])
        })
    }
  }, [dispatch, userRole, userId, tenant_id])

  // 4. Create Filtered Locations List
  const filteredLocations = useMemo(() => {
    if (userRole === 'viewer') {
      return locations.filter(loc =>
        assignedLocationIds.includes(String(loc.id))
      )
    }
    return locations
  }, [locations, userRole, assignedLocationIds])

  // 5. NEW: Auto-select first location for Viewer
  useEffect(() => {
    if (
      userRole === 'viewer' &&
      filteredLocations.length > 0 &&
      !selectedLocation
    ) {
      const firstLoc = filteredLocations[0]
      setSelectedLocation({ value: firstLoc.id, label: firstLoc.name })
    }
  }, [userRole, filteredLocations, selectedLocation])

  // Fetch Alerts
  const fetchAlertsData = useCallback(
    async (reset = false, loadMore = false) => {
      if (!tenant_id) return

      const currentSkip = reset ? 0 : skip
      const currentLimit = limit

      const queryParams = {
        type: 'event_alert',
        limit: currentLimit,
        skip: currentSkip,
        ...(readStatus !== null && { is_read: readStatus === 'read' }),
        ...(priorityFilter && {
          meta_filters: JSON.stringify({
            alert_priority: priorityFilter
          })
        }),
        ...(selectedLocation && { location_id: selectedLocation.value }),
        ...(selectedCamera && { camera_id: selectedCamera.value }),
        ...(startDate && {
          created_after: format(startDate, "yyyy-MM-dd'T'00:00:00")
        }),
        ...(endDate && {
          created_before: format(endDate, "yyyy-MM-dd'T'23:59:59")
        })
      }

      if (reset) {
        dispatch(resetAlerts())
        setSkip(0)
        setHasMore(true)
      }

      if (loadMore) {
        setIsFetchingMore(true)
      }

      const result = await dispatch(
        fetchAlerts({ tenantId: tenant_id, queryParams, reset })
      )

      if (result.payload && result.payload.results) {
        setHasMore(result.payload.results.length === currentLimit)
      } else {
        setHasMore(false)
      }

      if (loadMore) {
        setIsFetchingMore(false)
      }

      dispatch(setFilters({ tenantId: tenant_id }))
    },
    [
      dispatch,
      tenant_id,
      selectedLocation,
      selectedCamera,
      startDate,
      endDate,
      skip,
      limit,
      priorityFilter,
      readStatus
    ]
  )

  // Initial load + filters
  // Note: changing selectedLocation (via the viewer useEffect above) will trigger this automatically
  useEffect(() => {
    setSkip(0)
    fetchAlertsData(true)
    if (tenant_id) {
      dispatch(getLocations({ tenantId: tenant_id }))
      dispatch(getCameras({ tenantId: tenant_id }))
    }
  }, [
    tenant_id,
    selectedLocation,
    selectedCamera,
    startDate,
    endDate,
    priorityFilter,
    readStatus
  ])

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const options = {
      root: containerRef.current,
      rootMargin: '100px',
      threshold: 0.1
    }

    observerRef.current = new IntersectionObserver(entries => {
      const [entry] = entries
      if (entry.isIntersecting && hasMore && !isLoading && !isFetchingMore) {
        // Load more data
        setSkip(prevSkip => prevSkip + limit)
      }
    }, options)

    if (loaderRef.current) {
      observerRef.current.observe(loaderRef.current)
    }

    return () => {
      if (observerRef.current && loaderRef.current) {
        observerRef.current.unobserve(loaderRef.current)
      }
    }
  }, [hasMore, isLoading, isFetchingMore, limit])

  // Fetch more data when skip changes
  useEffect(() => {
    if (skip > 0) {
      fetchAlertsData(false, true)
    }
  }, [skip])

  // Select options
  const priorityOptions = [
    { value: 'high', label: t('alerts.high_priority') },
    { value: 'medium', label: t('alerts.medium_priority') },
    { value: 'low', label: t('alerts.low_priority') }
  ]

  const readOptions = [
    { value: 'read', label: t('alerts.read_alerts') },
    { value: 'unread', label: t('alerts.unread_alerts') }
  ]

  // Use filteredLocations for the dropdown options
  const locationOptions = filteredLocations.map(location => ({
    value: location.id,
    label: location.name
  }))

  const cameraOptions = cameras.map(camera => ({
    value: camera.id,
    label: camera.name
  }))

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: '#393A4A',
      borderColor: '#393A4A',
      color: 'white',
      borderRadius: '9999px',
      paddingLeft: '0.4rem',
      paddingRight: '0.4rem',
      boxShadow: state.isFocused ? '0 0 0 1px #6366F1' : 'none',
      '&:hover': { borderColor: '#393A4A' }
    }),
    singleValue: provided => ({ ...provided, color: 'white' }),
    placeholder: provided => ({ ...provided, color: '#A0AEC0' }),
    dropdownIndicator: provided => ({ ...provided, color: '#A0AEC0' }),
    menu: provided => ({
      ...provided,
      backgroundColor: '#393A4A',
      borderRadius: '0.5rem'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#4A5568' : '#393A4A',
      color: 'white'
    })
  }

  return (
    <div className='min-h-screen bg-[#1a1d29] p-6 w-full'>
      <div className='mx-auto max-w-full'>
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-white text-2xl font-semibold'>
            {t('alerts.latest_alerts')}
          </h1>
        </div>

        {/* Filters */}
        <div className='flex justify-start gap-4 mb-6 flex-wrap'>
          <div className='w-48'>
            <Select
              options={priorityOptions}
              onChange={opt => setPriorityFilter(opt ? opt.value : null)}
              placeholder={t('alerts.priority_placeholder')}
              isClearable
              styles={customStyles}
            />
          </div>

          <div className='w-48'>
            <Select
              options={locationOptions}
              onChange={opt => setSelectedLocation(opt)}
              value={selectedLocation}
              placeholder={t('alerts.location_placeholder')}
              isClearable
              styles={customStyles}
            />
          </div>

          <div className='w-52'>
            <Select
              options={cameraOptions}
              onChange={opt => setSelectedCamera(opt)}
              value={selectedCamera}
              placeholder={t('alerts.camera_placeholder')}
              isClearable
              styles={customStyles}
            />
          </div>

          <div className='w-48'>
            <Select
              options={readOptions}
              onChange={opt => setReadStatus(opt ? opt.value : null)}
              placeholder={t('alerts.read_status_placeholder')}
              isClearable
              styles={customStyles}
            />
          </div>

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

        {/* Alerts Section */}
        <div className='bg-[#2a2f45] w-full rounded-lg p-6'>
          <div className='flex flex-col lg:flex-row gap-6'>
            <div className='lg:w-[100%] w-full'>
              {alerts.length === 0 && !isLoading && !error && (
                <div className='text-center py-16'>
                  <p className='text-gray-400 text-sm'>
                    {t('alerts.no_alerts_at_this_time')}
                  </p>
                </div>
              )}

              {error && (
                <div className='bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-4'>
                  <p className='text-red-400 text-sm'>
                    <strong>{t('alerts.error')}:</strong> {error}
                  </p>
                </div>
              )}

              <div
                ref={containerRef}
                className='space-y-4 w-full max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#3b405e] scrollbar-track-[#1f2333] hover:scrollbar-thumb-[#4a5070] rounded-lg pr-2'
              >
                {alerts.map(alert => {
                  return (
                    <div key={alert.id}>
                      <AlertItem alert={alert} tenantId={tenant_id} />
                    </div>
                  )
                })}

                {/* Loading indicator for initial load */}
                {isLoading && !isFetchingMore && (
                  <div className='text-center py-4 text-gray-400 text-sm'>
                    {t('alerts.loading_alerts')}
                  </div>
                )}

                {/* Loading indicator for infinite scroll */}
                {isFetchingMore && (
                  <div className='text-center py-4 text-gray-400 text-sm'>
                    Loading more alerts...
                  </div>
                )}

                {/* No more data message */}
                {!hasMore && !isLoading && alerts.length > 0 && (
                  <div className='text-center py-4 text-gray-400 text-sm'>
                    No more alerts to load
                  </div>
                )}

                {/* Intersection observer target */}
                {hasMore && !isLoading && !isFetchingMore && (
                  <div ref={loaderRef} style={{ height: '20px' }} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Alerts

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import AlertItem from './alertlist'
import {
  fetchAlerts,
  clearAlerts,
  setFilters
} from '../../features/alert/alertSlice'
import { getLocations } from '../../features/locations/locationApiSlice'
import Select from 'react-select'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import format from 'date-fns/format'
import { useTranslation } from 'react-i18next'
import AlertStatusOverview from '../dashboardhome/components/AlertStatusOverview'

const Alerts = () => {
  const { t } = useTranslation()
  const tenant_id = localStorage.getItem('tenant_id')
  const dispatch = useDispatch()

  const { alerts, unreadCount, isLoading, error } = useSelector(
    state => state.alerts
  )
  const locations = useSelector(state => state.locationApi.locations)

  // Filters
  const [priorityFilter, setPriorityFilter] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [dateRange, setDateRange] = useState([null, null])
  const [startDate, endDate] = dateRange
  const [alertList, setAlertList] = useState([])

  // Pagination
  const [limit, setLimit] = useState(10)
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const loaderRef = useRef(null)

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      setAlertList(prev => {
        const newAlerts = alerts.filter(
          alert => !prev.some(existing => existing.id === alert.id)
        )
        return [...prev, ...newAlerts]
      })
    } else {
      setAlertList([])
    }
  }, [alerts])

  // Fetch Alerts
  const fetchAlertsData = useCallback(
    async (reset = false) => {
      if (!tenant_id) return
      const queryParams = {
        type: 'event_alert',
        limit: reset ? 10 : limit,
        skip: reset ? 0 : skip,
        is_read: false, // Only fetch unread alerts initially
        ...(priorityFilter && {
          meta_filters: JSON.stringify({
            alert_priority: priorityFilter
          })
        }),
        ...(selectedLocation && { location_id: selectedLocation.value }),
        ...(startDate && { created_after: format(startDate, 'yyyy-MM-dd') }),
        ...(endDate && { created_before: format(endDate, 'yyyy-MM-dd') })
      }

      if (reset) dispatch(clearAlerts())

      const result = await dispatch(
        fetchAlerts({ tenantId: tenant_id, queryParams })
      )
      console.log('initialize', result)
      if (result.payload && result.payload.length < limit) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }

      dispatch(setFilters({ tenantId: tenant_id }))
    },
    [
      dispatch,
      tenant_id,
      selectedLocation,
      startDate,
      endDate,
      skip,
      limit,
      priorityFilter
    ]
  )

  // Initial load + filters
  useEffect(() => {
    setSkip(0)
    setLimit(10)
    setHasMore(true)
    fetchAlertsData(true)
    if (tenant_id) dispatch(getLocations(tenant_id))
  }, [tenant_id, selectedLocation, startDate, endDate, priorityFilter])

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setSkip(prev => prev + 10)
        }
      },
      { threshold: 1.0 }
    )

    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current)
    }
  }, [hasMore, isLoading])

  // Fetch when skip or limit changes
  useEffect(() => {
    if (skip > 0) fetchAlertsData()
  }, [skip, limit])

  const priorityOptions = [
    { value: 'high', label: t('alerts.high_priority') },
    { value: 'medium', label: t('alerts.medium_priority') },
    { value: 'low', label: t('alerts.low_priority') }
  ]

  const locationOptions = locations.map(location => ({
    value: location.id,
    label: location.name
  }))

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: '#393A4A',
      borderColor: '#393A4A',
      color: 'white',
      borderRadius: '9999px',
      paddingLeft: '1rem',
      paddingRight: '1rem',
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
      <div className='max-w-7xl mx-auto'>
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
          <div className='w-48'>
            <DatePicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={update => setDateRange(update)}
              isClearable
              placeholderText={t('alerts.select_date_range')}
              className='w-full px-4 py-2 rounded-full bg-[#393A4A] text-white placeholder-[#A0AEC0] focus:outline-none focus:ring-1 focus:ring-[#6366F1]'
            />
          </div>
        </div>

        {/* Alerts Section (Two-Column Layout) */}
        <div className='bg-[#2a2f45] w-full rounded-lg p-6'>
          <div className='flex flex-col lg:flex-row gap-6'>
            {/* Left side — Alert Status Overview (30%) */}
            {/* <div className='lg:w-[30%] w-full'>
              <AlertStatusOverview />
            </div> */}

            {/* Right side — Alert List (70%) */}
            <div className='lg:w-[100%] w-full'>
              {alertList.length === 0 && !isLoading && !error && (
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

              <div className='space-y-4 w-full max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#3b405e] scrollbar-track-[#1f2333] hover:scrollbar-thumb-[#4a5070] rounded-lg pr-2'>
                {alertList.map(alert => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    tenantId={tenant_id}
                  />
                ))}

                {isLoading && (
                  <div className='text-center py-4 text-gray-400 text-sm'>
                    {t('alerts.loading_alerts')}
                  </div>
                )}

                {!hasMore && !isLoading && alertList.length > 0 && (
                  <div className='text-center py-4 text-gray-400 text-sm'>
                    No more data
                  </div>
                )}

                <div ref={loaderRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Alerts

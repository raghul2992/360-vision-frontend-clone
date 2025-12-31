import React, { useState, useEffect, useRef } from 'react'
import Select from 'react-select'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useTranslation } from 'react-i18next'
import {
  FiFilter,
  FiCalendar,
  FiMapPin,
  FiVideo,
  FiAlertCircle,
  FiTrendingUp,
  FiClock,
  FiShield,
  FiActivity
} from 'react-icons/fi'
import OverviewStatCard from '../../../component/OverviewStatCard'

// --- 1. React Select Custom Styles ---
const customStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: '#393A4A',
    borderRadius: '8px',
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
    border: '1px solid #4B5563',
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

// --- 2. Reusable Filter Dropdown Component ---
const FilterDropdown = ({
  locationOptions,
  cameraOptions,
  selectedLocation,
  setSelectedLocation,
  selectedCamera,
  setSelectedCamera,
  dateRange,
  setDateRange
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)
  const [startDate, endDate] = dateRange || [null, null]

  // Close on click outside
  useEffect(() => {
    function handleClickOutside (event) {
      const isOutsideWrapper =
        wrapperRef.current && !wrapperRef.current.contains(event.target)
      const isSelectMenu = event.target.closest('.react-select__menu')
      const isDatepicker = event.target.closest('.react-datepicker-popper')

      if (isOutsideWrapper && !isSelectMenu && !isDatepicker) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [wrapperRef])

  return (
    <div className='relative' ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 border border-transparent ${
          isOpen
            ? 'bg-[#6366F1] text-white'
            : 'bg-[#393A4A] text-gray-300 border-[#4B5563] hover:bg-[#4B4D63]'
        }`}
        title={t('Filter KPIs')}
      >
        <FiFilter size={16} />
      </button>

      {isOpen && (
        <div className='absolute right-0 top-12 w-[320px] bg-[#2a2f45] border border-[#4B5563] rounded-xl shadow-2xl p-4 z-50'>
          <div className='space-y-4'>
            {/* Location */}
            <div className='space-y-1'>
              <label className='text-xs text-gray-400 flex items-center gap-2'>
                <FiMapPin size={12} /> {t('Location') || 'Location'}
              </label>
              <Select
                options={locationOptions}
                value={selectedLocation}
                onChange={setSelectedLocation}
                placeholder={t('Select Location') || 'Select Location'}
                isClearable
                styles={customStyles}
              />
            </div>

            {/* Camera */}
            <div className='space-y-1'>
              <label className='text-xs text-gray-400 flex items-center gap-2'>
                <FiVideo size={12} /> {t('Camera') || 'Camera'}
              </label>
              <Select
                isDisabled={!selectedLocation}
                options={cameraOptions}
                value={selectedCamera}
                onChange={setSelectedCamera}
                placeholder={
                  selectedLocation
                    ? t('Select Camera') || 'Select Camera'
                    : t('Select Location First') || 'Select Location First'
                }
                isClearable
                styles={customStyles}
              />
            </div>

            {/* Date Picker */}
            <div className='space-y-1'>
              <label className='text-xs text-gray-400 flex items-center gap-2'>
                <FiCalendar size={12} /> {t('Date Range') || 'Date Range'}
              </label>
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={setDateRange}
                isClearable
                placeholderText={t('Select Date Range') || 'Select Date Range'}
                className='w-full px-4 py-2 rounded-lg bg-[#393A4A] text-white border border-[#4B5563] focus:outline-none focus:border-[#6366F1] text-sm'
                wrapperClassName='w-full'
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- 3. Main KPI Section Component ---
const KpiSection = ({ kpiData, isLoading, filterProps }) => {
  if (isLoading) {
    return (
      <div className='bg-[#2a2f45] rounded-xl p-6 md:p-10 mb-8 shadow-sm'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-white text-xl font-semibold'>
            Key Performance Indicators
          </h2>
          <div className='h-10 w-10 bg-[#1f2435] rounded-lg animate-pulse' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className='bg-[#1f2435] rounded-lg h-32 animate-pulse'
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='bg-[#2a2f45] rounded-xl p-6 md:p-10 mb-8 shadow-sm'>
      {/* Header with Title and Filter Dropdown */}
      <div className='flex flex-row items-center justify-between mb-6'>
        <h2 className='text-white text-xl font-semibold'>
          Key Performance Indicators
        </h2>

        {/* Pass the filterProps directly to the Dropdown */}
        {filterProps && <FilterDropdown {...filterProps} />}
      </div>

      {/* KPI Cards Grid - Adjusted for 5 items */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
        {/* 1. Total Alerts */}
        <OverviewStatCard
          title='Total Alerts'
          value={kpiData?.alertsCount ?? 0}
          icon={<FiAlertCircle className='text-red-500' size={20} />}
          trend={kpiData?.alertsCount > 50 ? 'high' : 'normal'}
        />
        {/* 2. Most Frequent Alert */}
        <OverviewStatCard
          title='Most Frequent'
          value={kpiData?.mostFrequent?.detection_type || '-'}
          sub={`${kpiData?.mostFrequent?.count ?? 0} occurrences`}
          icon={<FiTrendingUp className='text-yellow-500' size={20} />}
        />
        {/* 3. Busiest Hour */}
        <OverviewStatCard
          title='Busiest Hour'
          value={
            kpiData?.busiestHour?.time_start_utc
              ? kpiData.busiestHour.time_start_utc.slice(11, 16)
              : '--:--'
          }
          sub={
            kpiData?.busiestHour
              ? `${kpiData.busiestHour.count ?? 0} alerts`
              : 'No data'
          }
          icon={<FiClock className='text-blue-500' size={20} />}
        />
        {/* 4. Average Dwell Time */}
        <OverviewStatCard
          title='Avg Dwell Time'
          value={kpiData?.avgDwell?.average_dwell_time || '0m 0s'}
          icon={<FiActivity className='text-green-500' size={20} />}
        />
        {/* 5. Safety Violations (Added back)
        <OverviewStatCard
          title='Safety Violations'
          value={kpiData?.safetyViolations ?? 0}
          icon={<FiShield className='text-orange-500' size={20} />}
        /> */}
      </div>
    </div>
  )
}

export default KpiSection

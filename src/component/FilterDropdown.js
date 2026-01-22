import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom' // 1. Import ReactDOM
import Select from 'react-select'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useTranslation } from 'react-i18next'
import { FiFilter, FiCalendar, FiMapPin, FiVideo, FiX } from 'react-icons/fi'

// --- React Select Custom Styles ---
const customStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: '#393A4A',
    borderRadius: '8px',
    border: state.isFocused ? '1px solid #6366F1' : '1px solid #4B5563',
    boxShadow: 'none',
    color: '#E0E0E0',
    padding: '0px 2px',
    cursor: 'pointer',
    minHeight: '32px',
    fontSize: '12px'
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
    cursor: 'pointer',
    fontSize: '12px'
  }),
  singleValue: base => ({ ...base, color: '#FFFFFF', fontWeight: 500 }),
  placeholder: base => ({ ...base, color: '#A5ADC9', fontWeight: 400 }),
  input: base => ({ ...base, color: '#FFFFFF' }),
  menuPortal: base => ({ ...base, zIndex: 9999 })
}

const FilterDropdown = ({
  locationOptions = [],
  cameraOptions = [],
  selectedLocation,
  setSelectedLocation,
  selectedCamera,
  setSelectedCamera,
  dateRange,
  setDateRange,
  isMinimal = false
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [startDate, endDate] = dateRange || [null, null]

  // Refs for positioning
  const buttonRef = useRef(null)
  const dropdownRef = useRef(null)

  // State to store screen coordinates
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  // --- 2. Calculate Position ---
  const updatePosition = () => {
    if (buttonRef.current && isOpen) {
      const rect = buttonRef.current.getBoundingClientRect()
      const dropdownWidth = 280 // Width of the dropdown container

      // Calculate position relative to the viewport
      let top = rect.bottom + window.scrollY + 8
      let left = rect.right + window.scrollX - dropdownWidth

      // Prevent going off-screen to the left
      if (left < 10) left = rect.left + window.scrollX

      setCoords({ top, left })
    }
  }

  // Update position when opening or scrolling
  useEffect(() => {
    if (isOpen) {
      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

  // --- 3. Handle Click Outside (Updated for Portal) ---
  useEffect(() => {
    function handleClickOutside (event) {
      if (!isOpen) return

      // Check if click is inside Button OR Dropdown
      const isInsideButton =
        buttonRef.current && buttonRef.current.contains(event.target)
      const isInsideDropdown =
        dropdownRef.current && dropdownRef.current.contains(event.target)

      // Check third-party portals (React Select / Datepicker)
      const isSelectMenu = event.target.closest('.react-select__menu')
      const isDatepicker = event.target.closest('.react-datepicker-popper')
      const isSelectPortal = event.target.closest('.react-select__portal')

      if (
        !isInsideButton &&
        !isInsideDropdown &&
        !isSelectMenu &&
        !isDatepicker &&
        !isSelectPortal
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <>
      {/* --- Toggle Button --- */}
      <button
        ref={buttonRef} // Attach ref here
        onClick={e => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        // Stop dragging events from grid/widgets
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        className={`transition-colors duration-200 flex items-center justify-center ${
          isMinimal
            ? 'text-gray-400 hover:text-[#6366F1] p-1 rounded-md hover:bg-[#393A4A]'
            : `p-2 rounded-lg ${
                isOpen
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-[#393A4A] text-gray-300 hover:bg-[#4B4D63]'
              }`
        }`}
        title='Filter'
      >
        <FiFilter size={isMinimal ? 14 : 18} />
      </button>

      {/* --- 4. Render Dropdown via Portal --- */}
      {isOpen &&
        ReactDOM.createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: coords.top,
              left: coords.left,
              zIndex: 9999 // High Z-Index to stay on top
            }}
            className='w-[280px] bg-[#1a1c23] border border-[#4B5563] rounded-xl shadow-2xl p-4 cursor-default'
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className='flex justify-end items-center mb-3 pb-2 border-b border-gray-700'>
              <button
                onClick={e => {
                  e.stopPropagation()
                  setIsOpen(false)
                }}
                className='text-gray-500 hover:text-white'
              >
                <FiX size={14} />
              </button>
            </div>

            <div className='space-y-3'>
              {/* Location */}
              <div className='space-y-1'>
                <label className='text-[10px] uppercase text-gray-400 flex items-center gap-2 font-bold'>
                  <FiMapPin size={10} /> {t('dashboard.location') || 'Location'}
                </label>
                <Select
                  options={locationOptions}
                  value={selectedLocation}
                  onChange={setSelectedLocation}
                  placeholder='All Locations'
                  isClearable
                  styles={customStyles}
                  menuPortalTarget={document.body}
                  menuPosition='fixed'
                  classNamePrefix='react-select'
                />
              </div>

              {/* Camera */}
              <div className='space-y-1'>
                <label className='text-[10px] uppercase text-gray-400 flex items-center gap-2 font-bold'>
                  <FiVideo size={10} /> {t('dashboard.camera') || 'Camera'}
                </label>
                <Select
                  isDisabled={!selectedLocation}
                  options={cameraOptions}
                  value={selectedCamera}
                  onChange={setSelectedCamera}
                  placeholder={
                    selectedLocation ? 'All Cameras' : 'Select Location First'
                  }
                  isClearable
                  styles={customStyles}
                  menuPortalTarget={document.body}
                  menuPosition='fixed'
                  classNamePrefix='react-select'
                />
              </div>

              {/* Date Picker */}
              <div className='space-y-1'>
                <label className='text-[10px] uppercase text-gray-400 flex items-center gap-2 font-bold'>
                  <FiCalendar size={10} />{' '}
                  {t('alerts.date_range') || 'Date Range'}
                </label>
                <DatePicker
                  selectsRange
                  startDate={startDate}
                  endDate={endDate}
                  onChange={setDateRange}
                  isClearable
                  placeholderText='Select Date Range'
                  className='w-full px-3 py-1.5 text-xs rounded-lg bg-[#393A4A] text-white border border-[#4B5563] focus:outline-none focus:border-[#6366F1]'
                  wrapperClassName='w-full'
                  popperPlacement='bottom-end'
                  popperClassName='z-[9999]'
                  portalId='root-portal' // Helps Datepicker escape if needed
                />
              </div>
            </div>
          </div>,
          document.body // Attach to Body
        )}
    </>
  )
}

export default FilterDropdown

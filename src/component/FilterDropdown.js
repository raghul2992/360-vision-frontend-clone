import React, { useState, useEffect, useRef } from 'react'
import Select from 'react-select'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useTranslation } from 'react-i18next'
import { FiFilter, FiCalendar, FiMapPin, FiVideo } from 'react-icons/fi'

// --- React Select Custom Styles ---
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

// --- Reusable Filter Dropdown Component ---
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
  const [startDate, endDate] = dateRange || []

  // Close on click outside
  useEffect(() => {
    function handleClickOutside (event) {
      // Check if the click is outside the filter dropdown wrapper
      const isOutsideWrapper =
        wrapperRef.current && !wrapperRef.current.contains(event.target)

      // Check if the click is inside a react-select menu or datepicker popup
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
        className={`p-2 rounded-lg transition-colors duration-200 ${
          isOpen
            ? 'bg-[#6366F1] text-white'
            : 'bg-[#393A4A] text-gray-300 hover:bg-[#4B4D63]'
        }`}
      >
        <FiFilter size={18} />
      </button>

      {isOpen && (
        <div className='absolute right-0 top-12 w-[320px] bg-[#2a2f45] border border-[#4B5563] rounded-xl shadow-2xl p-4 z-50'>
          <div className='space-y-4'>
            {/* Location */}
            <div className='space-y-1'>
              <label className='text-xs text-gray-400 flex items-center gap-2'>
                <FiMapPin size={12} /> {t('dashboard.location')}
              </label>
              <Select
                options={locationOptions}
                value={selectedLocation}
                onChange={setSelectedLocation}
                placeholder={t('dashboard.select_location')}
                isClearable
                styles={customStyles}
              />
            </div>

            {/* Camera (Conditional) */}
            <div className='space-y-1'>
              <label className='text-xs text-gray-400 flex items-center gap-2'>
                <FiVideo size={12} /> {t('dashboard.camera')}
              </label>
              <Select
                isDisabled={!selectedLocation}
                options={cameraOptions}
                value={selectedCamera}
                onChange={setSelectedCamera}
                placeholder={
                  selectedLocation
                    ? t('dashboard.select_camera')
                    : t('dashboard.select_location_first')
                }
                isClearable
                styles={customStyles}
              />
            </div>

            {/* Date Picker */}
            <div className='space-y-1'>
              <label className='text-xs text-gray-400 flex items-center gap-2'>
                <FiCalendar size={12} /> {t('alerts.date_range')}
              </label>
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={setDateRange}
                isClearable
                placeholderText={t('alerts.select_date_range')}
                className='w-full px-4 py-2 rounded-lg bg-[#393A4A] text-white border border-[#4B5563] focus:outline-none focus:border-[#6366F1]'
                wrapperClassName='w-full'
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FilterDropdown

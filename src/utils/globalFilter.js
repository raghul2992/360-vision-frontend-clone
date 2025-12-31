import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Select from 'react-select'
import { FiGlobe, FiX } from 'react-icons/fi'
import { format } from 'date-fns'

const GlobalFilterModal = ({
  isOpen,
  onClose,
  locations,
  cameras,
  onApplyGlobalFilter,
  globalFilters
}) => {
  const { t } = useTranslation()
  const [selectedLocation, setSelectedLocation] = useState(
    globalFilters.location
  )
  const [selectedCamera, setSelectedCamera] = useState(globalFilters.camera)
  const [dateRange, setDateRange] = useState(globalFilters.dateRange)
  const [useGlobalFilter, setUseGlobalFilter] = useState(globalFilters.enabled)

  if (!isOpen) return null

  const locationOptions = locations.map(loc => ({
    value: loc.id || loc._id,
    label: loc.name
  }))

  const cameraOptions = cameras
    .filter(
      cam => !selectedLocation || cam.location_id === selectedLocation?.value
    )
    .map(cam => ({ value: cam.id, label: cam.name }))

  const handleApply = () => {
    onApplyGlobalFilter({
      enabled: useGlobalFilter,
      location: selectedLocation,
      camera: selectedCamera,
      dateRange: dateRange
    })
    onClose()
  }

  const handleReset = () => {
    setSelectedLocation(null)
    setSelectedCamera(null)
    setDateRange([new Date(), new Date()])
    setUseGlobalFilter(false)
    onApplyGlobalFilter({
      enabled: false,
      location: null,
      camera: null,
      dateRange: [new Date(), new Date()]
    })
    onClose()
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]'>
      <div className='bg-[#2a2f45] rounded-xl p-6 max-w-md w-full mx-4 max-h-[500px] overflow-y-scroll'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <FiGlobe className='text-blue-400' size={24} />
            <h2 className='text-white text-2xl font-semibold'>
              {/* {t('dashboard.global_filters')} */}
              Global Filters
            </h2>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white transition-colors'
          >
            <FiX size={24} />
          </button>
        </div>

        <div className='space-y-6'>
          {/* Location Filter */}
          <div>
            <label className='block text-white font-medium mb-2'>
              Location
            </label>
            <Select
              value={selectedLocation}
              onChange={setSelectedLocation}
              options={locationOptions}
              isClearable
              placeholder='Select location'
              className='react-select-container'
              classNamePrefix='react-select'
              styles={{
                control: base => ({
                  ...base,
                  backgroundColor: '#1a1d29',
                  borderColor: '#3B3F58',
                  color: 'white'
                }),
                menu: base => ({
                  ...base,
                  backgroundColor: '#2a2f45',
                  color: 'white'
                }),
                singleValue: base => ({
                  ...base,
                  color: 'white'
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? '#3B3F58' : '#2a2f45',
                  color: 'white'
                })
              }}
            />
          </div>

          {/* Camera Filter */}
          <div>
            <label className='block text-white font-medium mb-2'>Camera</label>
            <Select
              value={selectedCamera}
              onChange={setSelectedCamera}
              options={cameraOptions}
              isClearable
              isDisabled={!selectedLocation}
              placeholder={
                selectedLocation ? 'Select camera' : 'Select location first'
              }
              className='react-select-container'
              classNamePrefix='react-select'
              styles={{
                control: base => ({
                  ...base,
                  backgroundColor: '#1a1d29',
                  borderColor: '#3B3F58',
                  color: 'white'
                }),
                menu: base => ({
                  ...base,
                  backgroundColor: '#2a2f45',
                  color: 'white'
                }),
                singleValue: base => ({
                  ...base,
                  color: 'white'
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? '#3B3F58' : '#2a2f45',
                  color: 'white'
                })
              }}
            />
          </div>

          {/* Date Range */}
          <div>
            <label className='block text-white font-medium mb-2'>
              Date Range
            </label>
            <input
              type='date'
              value={dateRange?.[0] ? format(dateRange[0], 'yyyy-MM-dd') : ''}
              onChange={e => {
                const start = e.target.value
                  ? new Date(e.target.value)
                  : new Date()
                const end = dateRange?.[1] || new Date()
                setDateRange([start, end])
              }}
              className='w-full bg-[#1a1d29] border border-[#3B3F58] rounded-lg px-4 py-2 text-white'
            />
            <div className='flex items-center justify-center my-2'>
              <span className='text-gray-400'>to</span>
            </div>
            <input
              type='date'
              value={dateRange?.[1] ? format(dateRange[1], 'yyyy-MM-dd') : ''}
              onChange={e => {
                const start = dateRange?.[0] || new Date()
                const end = e.target.value
                  ? new Date(e.target.value)
                  : new Date()
                setDateRange([start, end])
              }}
              className='w-full bg-[#1a1d29] border border-[#3B3F58] rounded-lg px-4 py-2 text-white'
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-3 mt-8'>
          <button
            onClick={handleReset}
            className='flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors'
          >
            Reset All
          </button>
          <button
            onClick={handleApply}
            className='flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors'
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}
export default GlobalFilterModal

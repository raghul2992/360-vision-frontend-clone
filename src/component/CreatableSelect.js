import React, { useState } from 'react'
import { IoChevronDown } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'

const CreateTableSelect = ({
  options = [],
  value,
  onChange,
  placeholder,
  disabled,
  onCreate,
  onCreateNew 
}) => {
  // const navigate = useNavigate()

  // Normalize options from API
  const normalizedOptions = Array.isArray(options)
    ? options
    : Array.isArray(options?.data)
    ? options.data
    : []

  const validOptions = normalizedOptions.filter(
    opt => opt && typeof opt === 'object' && 'id' in opt && 'name' in opt
  )

  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = optionValue => {
    onChange?.({ target: { value: optionValue } })
    setIsOpen(false)
  }

  const handleCreateLocation = () => {
    setIsOpen(false)
    // navigate('/location')
     onCreateNew?.() 
  }

  const filteredOptions = validOptions.filter(option =>
    option.name?.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <div className='relative'>
      <div
        className={`w-full bg-[#3A3B47] border border-gray-600/50 rounded-lg py-2.5 px-4 pr-10 text-white focus:outline-none focus:border-gray-500 text-sm appearance-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {value ? validOptions.find(op => op.id === value)?.name : placeholder}
        <IoChevronDown
          className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
          size={16}
        />
      </div>

      {isOpen && (
        <div className='absolute z-10 w-full mt-1 bg-[#3A3B47] border border-gray-600/50 rounded-lg shadow-lg'>
          <div className='p-2'>
            <input
              type='text'
              className='w-full bg-[#2A2B36] border border-gray-600/50 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 text-sm'
              placeholder='Type to search...'
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>

          <ul className='max-h-60 overflow-y-auto'>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li
                  key={option.id ?? option.name}
                  className='px-3 py-2 text-white cursor-pointer hover:bg-[#2A2B36]'
                  onClick={() => handleSelect(option.id)}
                >
                  {option.name}
                </li>
              ))
            ) : (
              <li className='px-3 py-2 text-gray-400 text-sm'>
                No matches found
              </li>
            )}
          </ul>

          {/* --- Separator --- */}
          <div className='flex items-center justify-center gap-3 text-gray-400 text-sm my-2 px-3'>
            <span className='flex-1 border-t border-gray-600/50'></span>
            <span>or</span>
            <span className='flex-1 border-t border-gray-600/50'></span>
          </div>

          {/* --- Navigate to /location using useNavigate --- */}
          <div className='p-2 pt-0'>
            <button
              onClick={handleCreateLocation}
              className='w-full text-center bg-[#3885CC] hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors'
            >
              Create a location
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateTableSelect

import React, { useState } from 'react'
import { ChevronDownIcon } from '../icons'
import { bgcolors, textcolors, borderstyles, iconSizes } from '../theme'

const SearchableSelect = ({
  options = [],
  name,
  value,
  onChange,
  placeholder,
  disabled,
}) => {
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
    onChange?.({ target: { name, value: optionValue } })
    setIsOpen(false)
  }

  const filteredOptions = validOptions.filter(option =>
    option.name?.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <div className='relative'>
      <div
        className={`w-full ${bgcolors.surface} ${borderstyles.light} rounded-lg py-2.5 px-4 pr-10 ${textcolors.normaltext} focus:outline-none text-sm appearance-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {value ? validOptions.find(op => op.id === value)?.name : <span className={textcolors.muted}>{placeholder}</span>}
        <ChevronDownIcon
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${textcolors.muted} pointer-events-none`}
          size={iconSizes.info}
        />
      </div>

      {isOpen && (
        <div className={`absolute z-10 w-full mt-1 ${bgcolors.white} ${borderstyles.light} rounded-xl shadow-lg overflow-hidden`}>
          <div className='p-2'>
            <input
              type='text'
              className={`w-full ${bgcolors.surface} ${borderstyles.light} rounded-lg py-2 px-3 ${textcolors.normaltext} ${textcolors.placeholder} focus:outline-none ${borderstyles.focusRing} text-sm`}
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
                  className={`px-4 py-2.5 ${textcolors.normaltext} cursor-pointer ${bgcolors.accentHover} ${textcolors.accentHover} text-sm transition-colors mx-1 rounded-lg`}
                  onClick={() => handleSelect(option.id)}
                >
                  {option.name}
                </li>
              ))
            ) : (
              <li className={`px-3 py-2 ${textcolors.muted} text-sm`}>
                No matches found
              </li>
            )}
          </ul>

          <div className={`flex items-center justify-center gap-3 ${textcolors.muted} text-sm my-2 px-3`}>
            <span className={`flex-1 ${borderstyles.separator}`}></span>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchableSelect

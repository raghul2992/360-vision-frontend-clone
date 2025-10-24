import { useState } from 'react'
import { bgcolors } from '../theme'
import openeye from "../assets/open-eye.png"
import closeeye from "../assets/hide-eye.png"

export default function PasswordInput ({
  label,
  icon,
  value,
  onChange,
  placeholder,
  style = {},
  className = '',
  ...rest
}) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ marginBottom: 16 }} className='w-full'>
      {label && (
        <label style={{ fontWeight: 'bold', marginBottom: 4 }}>{label}</label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#aaaaaa'
            }}
          >
            {icon}
          </span>
        )}
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            paddingLeft: icon ? 32 : 12,
            paddingRight: 32,
            ...style
          }}
          className={`${
            bgcolors.inputbg
          } w-full  py-[10px] px-[14px]  rounded-[9px] outline-none ${
            icon ? 'pl-9' : ''
          } ${className}`}
          {...rest}
        />
        <span
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#aaaaaa',
            cursor: 'pointer'
          }}
          onClick={() => setShow(v => !v)}
        >
          {show ? (
            <img src={closeeye} alt='close eye' />
          ) : (
            <img src={openeye} alt='open eye' />
          )}
        </span>
      </div>
    </div>
  )
}

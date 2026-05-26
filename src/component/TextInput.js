import { bgcolors, borderstyles, textcolors } from '../theme'

export default function TextInput ({
  icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
  ...rest
}) {
  return (
    <div className={`w-full relative border border-transparent ${borderstyles.focusWithinAccent} rounded-[9px]`}>
      {icon && (
        <span className={`absolute left-2 top-1/2 transform -translate-y-1/2 ${textcolors.muted}`}>
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${bgcolors.inputbg} w-full  py-[10px] px-[14px] rounded-[9px] outline-none ${
          icon ? 'pl-9' : ''
        } ${className}`}
        {...rest}
      />
    </div>
  )
}

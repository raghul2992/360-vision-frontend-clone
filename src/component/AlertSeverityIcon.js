import React from 'react'

// Custom SVG for the high severity alert icon (Exclamation mark in a filled circle)
const SeverityAlertIcon = ({ className, color }) => (
  <svg
    className={className}
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 20 20'
    fill={color}
    aria-hidden='true'
  >
    <path
      fillRule='evenodd'
      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z'
      clipRule='evenodd'
    />
  </svg>
)

/**
 * Renders an alert severity indicator icon and text.
 * @param {object} props
 * @param {string} props.severity - The severity level (e.g., 'High Severity', 'Medium Severity').
 * @param {string} props.iconColor - Tailwind CSS class for icon color (e.g., 'text-red-600').
 * @param {string} props.textColor - Tailwind CSS class for text color (e.g., 'text-red-700').
 */
const AlertSeverityIcon = ({
  severity = 'High Severity',
  iconColor = 'text-red-600',
  textColor = 'text-red-700'
}) => {
  // Extract base color (e.g., 'red-600') from the Tailwind class
  const baseColorClass = iconColor.match(/text-([a-z]+-\d+)/)?.[1]
  const fillClass = baseColorClass ? `text-${baseColorClass}` : 'text-red-600'

  // Ensure the text matches the visual requirement from the image
  const displayText = severity

  return (
    <div className='flex items-center space-x-1'>
      <SeverityAlertIcon
        className={`w-5 h-5 ${fillClass}`}
        color='currentColor'
      />
      <span className={`text-base font-medium ${textColor}`}>
        {displayText}
      </span>
    </div>
  )
}

export default AlertSeverityIcon

import moment from 'moment-timezone'

export const formatDateTime = (dateString, locale = 'en-US') => {
  if (!dateString) return ''

  let processedDateString = dateString

  // Only append 'Z' if the date string doesn't already have timezone information
  if (
    typeof dateString === 'string' &&
    !dateString.endsWith('Z') &&
    !/[-+]\d{2}:\d{2}$/.test(dateString)
  ) {
    // This logic might be too simplistic. A better approach is to know the expected format.
    // Assuming incoming non-timezone strings are UTC.
    processedDateString += 'Z'
  }

  // Get user's timezone from browser
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const options = {
    timeZone: userTimeZone, // Use user's local timezone
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }

  try {
    return new Date(processedDateString).toLocaleString(locale, options)
  } catch (error) {
    console.error('Invalid date format:', dateString, error)
    return ''
  }
}

export const convertTimeLocalToUTC = (localTime, userTimeZone) => {
  if (!localTime || !userTimeZone) return localTime
  // Use today's date, interpret time in userTimeZone, then convert to UTC and format as HH:mm
  return moment.tz(localTime, 'HH:mm', userTimeZone).utc().format('HH:mm')
}

export const convertTimeUTCToLocal = (utcTime, userTimeZone) => {
  if (!utcTime || !userTimeZone) return utcTime
  // Interpret time as UTC, convert to userTimeZone, and format as HH:mm
  return moment.utc(utcTime, 'HH:mm').tz(userTimeZone).format('HH:mm')
}

export const convertTimeSlotsLocalToUTC = (timeSlots, userTimeZone) => {
  if (!timeSlots || !timeSlots.length || !userTimeZone) return timeSlots
  return timeSlots.map(([start, end]) => [
    convertTimeLocalToUTC(start, userTimeZone),
    convertTimeLocalToUTC(end, userTimeZone)
  ])
}

export const convertTimeSlotsUTCToLocal = (timeSlots, userTimeZone) => {
  if (!timeSlots || !timeSlots.length || !userTimeZone) return timeSlots
  return timeSlots.map(([start, end]) => [
    convertTimeUTCToLocal(start, userTimeZone),
    convertTimeUTCToLocal(end, userTimeZone)
  ])
}

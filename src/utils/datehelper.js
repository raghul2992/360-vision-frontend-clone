export const formatDateTime = (dateString, locale = 'en-US') => {
  if (!dateString) return ''

  let processedDateString = dateString

  if (typeof dateString === 'string') {
    processedDateString += 'Z'
  }

  const options = {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }

  try {
    return new Date(processedDateString).toLocaleString(locale, options)
  } catch (error) {
    console.error('Invalid date format:', dateString, error)
    return ''
  }
}

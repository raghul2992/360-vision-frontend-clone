export const formatDateTime = (dateString, locale = 'en-US') => {
  if (!dateString) return ''

  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }

  try {
    return new Date(dateString).toLocaleString(locale, options)
  } catch (error) {
    console.error('Invalid date format:', dateString, error)
    return ''
  }
}

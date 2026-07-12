export const formatDate = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export const formatCurrency = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') return ''
  const numericValue = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(numericValue)) return ''
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)
}

export const normalizePlaka = (value: string) => value.replace(/\s+/g, '').toUpperCase()

export const getTodayString = () => new Date().toISOString().slice(0, 10)

export const isValidFutureDate = (value?: string) => {
  if (!value) return false
  const selected = new Date(`${value}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return selected <= today
}

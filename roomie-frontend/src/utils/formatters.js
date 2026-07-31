/** Formatting helpers shared across features. */

const dirham = new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 })

/** 2500 → "2 500 DH". */
export function formatPrice(value) {
  if (value == null) return '—'
  return `${dirham.format(value)} DH`
}

/** 2500 → "2 500 DH/month". */
export function formatMonthlyPrice(value) {
  return `${formatPrice(value)}/month`
}

export function formatDate(value, options) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  })
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "just now" / "3h ago" / "12 Mar 2026". */
export function formatRelative(value) {
  if (!value) return ''
  const then = new Date(value).getTime()
  const seconds = Math.round((Date.now() - then) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(value)
}

/** Splits a chat log into day groups for date separators. */
export function groupByDay(messages) {
  const groups = []
  let currentKey = null

  messages.forEach((message) => {
    const key = new Date(message.created_at).toDateString()
    if (key !== currentKey) {
      currentKey = key
      groups.push({ key, label: dayLabel(message.created_at), items: [] })
    }
    groups[groups.length - 1].items.push(message)
  })
  return groups
}

function dayLabel(value) {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return formatDate(value)
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

/** Absolute URL for images the API serves from /uploads. */
export function resolveImage(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  const base = (
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'
  ).replace(/\/api\/v1\/?$/, '')
  return `${base}${url}`
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

/** Local datetime string for <input type="datetime-local"> defaults. */
export function toDatetimeLocal(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

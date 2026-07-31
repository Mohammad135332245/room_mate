import { Loader2, Star } from 'lucide-react'

export function Spinner({ size = 22, className = '' }) {
  return (
    <Loader2
      size={size}
      className={`animate-spin text-terracotta ${className}`}
      aria-hidden="true"
    />
  )
}

export function LoadingBlock({ label = 'Loading…', className = '' }) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`}
    >
      <Spinner size={28} />
      <p className="text-sm text-ink-soft">{label}</p>
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-md bg-tan-soft ${className}`} />
  )
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-tan bg-shell">
      <Skeleton className="h-48 rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    </div>
  )
}

export function Rating({ value, count, size = 14, className = '' }) {
  if (value == null) {
    return <span className={`text-sm text-ink-muted ${className}`}>No reviews yet</span>
  }
  return (
    <span className={`inline-flex items-center gap-1 text-sm ${className}`}>
      {[1, 2, 3, 4, 5].map((step) => (
        <Star
          key={step}
          size={size}
          className={
            step <= Math.round(value)
              ? 'fill-warning text-warning'
              : 'text-tan'
          }
          aria-hidden="true"
        />
      ))}
      <span className="ml-1 text-ink-soft">
        {value.toFixed(1)}
        {count != null && ` (${count})`}
      </span>
    </span>
  )
}

/** Small crescent-and-star motif used as a section accent. */
export function CrescentAccent({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`text-terracotta opacity-20 ${className}`}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M14.5 2a10 10 0 1 0 6.8 17.3A8.5 8.5 0 0 1 14.5 2Z" />
      <path d="m19.2 6.4.9 2 2.2.2-1.7 1.5.5 2.2-1.9-1.2-1.9 1.2.5-2.2L16 8.6l2.2-.2.9-2Z" />
    </svg>
  )
}

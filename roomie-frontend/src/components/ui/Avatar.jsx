import { initials, resolveImage } from '../../utils/formatters'

const SIZES = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
}

export default function Avatar({ user, size = 'md', className = '' }) {
  const url = resolveImage(user?.avatar_url)

  return url ? (
    <img
      src={url}
      alt={user?.name ?? 'Avatar'}
      className={`${SIZES[size]} shrink-0 rounded-full border border-tan object-cover ${className}`}
    />
  ) : (
    <span
      aria-hidden="true"
      className={`${SIZES[size]} flex shrink-0 items-center justify-center rounded-full bg-ochre/25 font-semibold text-ink-soft ${className}`}
    >
      {initials(user?.name)}
    </span>
  )
}

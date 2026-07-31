import { Link } from 'react-router-dom'

import JariMark from './JariMark'

/**
 * Brand lockup: the mark plus the Arabic wordmark.
 *
 * `horizontal` (default) sets the wordmark beside the mark and suits the
 * navbar; `stacked` puts it underneath, the way the full logo is drawn.
 */
export default function Logo({
  to = '/',
  variant = 'horizontal',
  size = 38,
  cutout,
  className = '',
}) {
  const stacked = variant === 'stacked'

  const classes = [
    stacked
      ? 'inline-flex flex-col items-center gap-1.5'
      : 'inline-flex items-center gap-2.5',
    'text-ink no-underline',
    className,
  ].join(' ')

  return (
    <Link to={to} className={classes}>
      <JariMark size={stacked ? size * 1.6 : size} cutout={cutout} />
      <span
        lang="ar"
        dir="rtl"
        className={`font-display leading-none font-bold text-terracotta ${
          stacked ? 'text-3xl' : 'text-2xl'
        }`}
      >
        جَاري
      </span>
    </Link>
  )
}

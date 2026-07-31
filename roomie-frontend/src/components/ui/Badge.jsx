const TONES = {
  neutral: 'bg-tan-soft text-ink-soft border-tan',
  primary: 'bg-terracotta/12 text-terracotta-dark border-terracotta/30',
  success: 'bg-sage/15 text-sage-dark border-sage/35',
  warning: 'bg-warning/15 text-warning border-warning/35',
  danger: 'bg-danger/12 text-danger border-danger/30',
  info: 'bg-ochre/18 text-ink-soft border-ochre/40',
}

export default function Badge({
  tone = 'neutral',
  icon: Icon,
  className = '',
  children,
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5',
        'text-xs font-medium whitespace-nowrap',
        TONES[tone] ?? TONES.neutral,
        className,
      ].join(' ')}
    >
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  )
}

/** Amenity / feature pill. */
export function Tag({ children, onRemove, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-base border border-tan bg-tan-soft/60 px-2.5 py-1 text-xs text-ink-soft ${className}`}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="cursor-pointer text-ink-muted hover:text-danger"
          aria-label={`Remove ${children}`}
        >
          ×
        </button>
      )}
    </span>
  )
}

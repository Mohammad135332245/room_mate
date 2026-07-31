export default function Card({
  as: Tag = 'div',
  hover = false,
  padded = true,
  className = '',
  children,
  ...props
}) {
  return (
    <Tag
      className={[
        'rounded-lg border border-tan bg-shell shadow-[var(--shadow-card)]',
        padded ? 'p-5' : '',
        hover
          ? 'transition-all duration-200 hover:-translate-y-0.5 hover:border-ochre hover:shadow-[var(--shadow-lift)]'
          : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`mb-4 flex items-start justify-between gap-4 ${className}`}>
      <div>
        <h3 className="text-lg">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-tan bg-shell/60 px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-tan-soft text-ochre">
          <Icon size={26} aria-hidden="true" />
        </span>
      )}
      <h3 className="text-lg">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

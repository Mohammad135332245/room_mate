import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary:
    'bg-terracotta text-shell hover:bg-terracotta-dark active:bg-terracotta-dark shadow-sm',
  secondary:
    'bg-shell text-ink border border-tan hover:bg-tan-soft hover:border-ochre',
  success: 'bg-sage text-shell hover:bg-sage-dark shadow-sm',
  danger: 'bg-danger text-shell hover:brightness-90 shadow-sm',
  ghost: 'text-ink-soft hover:bg-tan-soft hover:text-ink',
  link: 'text-terracotta hover:text-terracotta-dark underline underline-offset-4 px-0',
}

const SIZES = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconRight = false,
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}) {
  const classes = [
    'inline-flex items-center justify-center rounded-md font-medium',
    'transition-colors duration-150 cursor-pointer',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-inherit',
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ')

  const glyph = loading ? (
    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
  ) : Icon ? (
    <Icon size={16} aria-hidden="true" />
  ) : null

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {!iconRight && glyph}
      {children}
      {iconRight && glyph}
    </button>
  )
}

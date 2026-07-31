import { useId } from 'react'

const FIELD_CLASSES =
  'w-full rounded-md border bg-shell px-3 py-2.5 text-ink placeholder:text-ink-muted/70 ' +
  'transition-colors focus:border-terracotta focus:outline-none ' +
  'disabled:bg-tan-soft/50 disabled:cursor-not-allowed'

function Wrapper({ id, label, error, hint, required, children }) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-ink-soft"
        >
          {label}
          {required && <span className="ml-0.5 text-terracotta">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export default function Input({
  label,
  error,
  hint,
  icon: Icon,
  className = '',
  required,
  id: providedId,
  ...props
}) {
  const generatedId = useId()
  const id = providedId ?? generatedId

  return (
    <Wrapper id={id} label={label} error={error} hint={hint} required={required}>
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          aria-invalid={Boolean(error)}
          className={`${FIELD_CLASSES} ${Icon ? 'pl-10' : ''} ${
            error ? 'border-danger' : 'border-tan'
          } ${className}`}
          {...props}
        />
      </div>
    </Wrapper>
  )
}

export function Textarea({
  label,
  error,
  hint,
  rows = 4,
  className = '',
  required,
  id: providedId,
  ...props
}) {
  const generatedId = useId()
  const id = providedId ?? generatedId

  return (
    <Wrapper id={id} label={label} error={error} hint={hint} required={required}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={`${FIELD_CLASSES} resize-y ${
          error ? 'border-danger' : 'border-tan'
        } ${className}`}
        {...props}
      />
    </Wrapper>
  )
}

export function Select({
  label,
  error,
  hint,
  options = [],
  placeholder,
  className = '',
  required,
  id: providedId,
  ...props
}) {
  const generatedId = useId()
  const id = providedId ?? generatedId

  return (
    <Wrapper id={id} label={label} error={error} hint={hint} required={required}>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        className={`${FIELD_CLASSES} cursor-pointer appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9 ${
          error ? 'border-danger' : 'border-tan'
        } ${className}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235A4A3A' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value
          const text = typeof option === 'string' ? option : option.label
          return (
            <option key={value} value={value}>
              {text}
            </option>
          )
        })}
      </select>
    </Wrapper>
  )
}

export function Checkbox({ label, className = '', id: providedId, ...props }) {
  const generatedId = useId()
  const id = providedId ?? generatedId

  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft select-none ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 cursor-pointer rounded-sm border-tan accent-terracotta"
        {...props}
      />
      {label}
    </label>
  )
}

export function Switch({ label, checked, onChange, id: providedId, ...props }) {
  const generatedId = useId()
  const id = providedId ?? generatedId

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 text-sm text-ink-soft select-none"
    >
      <span className="relative inline-block h-6 w-11 shrink-0">
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={onChange}
          {...props}
        />
        <span className="absolute inset-0 rounded-full bg-tan transition-colors peer-checked:bg-sage" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-shell shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
      {label}
    </label>
  )
}

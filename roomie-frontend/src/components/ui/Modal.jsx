import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import Button from './Button'

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  children,
}) {
  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event) => event.key === 'Escape' && onClose?.()
    const previousOverflow = document.body.style.overflow

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-slide-up relative z-10 w-full ${SIZES[size]} max-h-[92vh] overflow-y-auto rounded-t-xl border border-tan bg-shell shadow-[var(--shadow-modal)] sm:rounded-xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-tan px-6 py-4">
          <div>
            <h2 className="text-xl">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-ink-soft">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mt-1 cursor-pointer rounded-base p-1.5 text-ink-muted transition-colors hover:bg-tan-soft hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer && (
          <div className="flex justify-end gap-3 border-t border-tan px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-soft">{message}</p>
    </Modal>
  )
}

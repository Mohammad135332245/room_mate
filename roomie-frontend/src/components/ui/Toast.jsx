import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const TONES = {
  success: { icon: CheckCircle2, classes: 'border-sage/50 bg-sage/12 text-sage-dark' },
  error: { icon: AlertCircle, classes: 'border-danger/45 bg-danger/10 text-danger' },
  info: { icon: Info, classes: 'border-ochre/50 bg-ochre/12 text-ink-soft' },
}

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (message, tone = 'info', duration = 4000) => {
      const id = ++nextId
      setToasts((current) => [...current, { id, message, tone }])
      if (duration) setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      toast: push,
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
      info: (message) => push(message, 'info'),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed top-4 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
          {toasts.map(({ id, message, tone }) => {
            const { icon: Icon, classes } = TONES[tone] ?? TONES.info
            return (
              <div
                key={id}
                role="status"
                className={`animate-fade-in pointer-events-auto flex items-start gap-2.5 rounded-md border px-4 py-3 shadow-[var(--shadow-lift)] backdrop-blur-sm ${classes}`}
              >
                <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p className="flex-1 text-sm">{message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(id)}
                  aria-label="Dismiss notification"
                  className="cursor-pointer opacity-60 transition-opacity hover:opacity-100"
                >
                  <X size={15} />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside a ToastProvider')
  return context
}

import { useCallback, useState } from 'react'

/** Open/close state plus an optional payload for the modal being shown. */
export function useModal(initial = false) {
  const [open, setOpen] = useState(initial)
  const [payload, setPayload] = useState(null)

  const show = useCallback((value = null) => {
    setPayload(value)
    setOpen(true)
  }, [])

  const hide = useCallback(() => {
    setOpen(false)
    setPayload(null)
  }, [])

  return { open, payload, show, hide, setOpen }
}

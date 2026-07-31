import { useState } from 'react'

import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Input'
import { applicationsApi } from '../../core/api/endpoints'
import { errorMessage } from '../../core/api/client'
import { formatMonthlyPrice } from '../../utils/formatters'
import { useToast } from '../../components/ui/Toast'

export default function ApplyModal({ open, onClose, listing, onApplied }) {
  const toast = useToast()
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    try {
      const application = await applicationsApi.submit({
        listing_id: listing.id,
        message: message.trim() || undefined,
      })
      toast.success('Application sent — the owner has been notified')
      onApplied?.(application)
      setMessage('')
      onClose()
    } catch (error) {
      toast.error(errorMessage(error, 'Could not send your application'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Apply for this room"
      description={`${listing?.title} — ${formatMonthlyPrice(listing?.price)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting}>
            Send application
          </Button>
        </>
      }
    >
      <Textarea
        label="Message to the owner (optional)"
        rows={5}
        maxLength={1500}
        placeholder="Introduce yourself: what you study, when you'd move in, and anything the owner should know."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        hint={`${message.length}/1500 — a short note makes a real difference.`}
      />
      <p className="mt-4 rounded-md border border-tan bg-cream/60 px-4 py-3 text-sm text-ink-soft">
        Once the owner accepts, a private chat opens and you can book a viewing.
      </p>
    </Modal>
  )
}

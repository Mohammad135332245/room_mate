import { useState } from 'react'
import { Link as LinkIcon, MapPin, Video } from 'lucide-react'

import Button from '../../components/ui/Button'
import Input, { Textarea } from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { MEETING_TYPES } from '../../core/config/constants'
import { errorMessage } from '../../core/api/client'
import { meetingsApi } from '../../core/api/endpoints'
import { toDatetimeLocal } from '../../utils/formatters'
import { useToast } from '../../components/ui/Toast'

/** Suggested slots: the next few days at sensible viewing hours. */
function suggestedSlots() {
  const slots = []
  for (let day = 1; day <= 3; day += 1) {
    for (const hour of [10, 14, 17]) {
      const date = new Date()
      date.setDate(date.getDate() + day)
      date.setHours(hour, 0, 0, 0)
      slots.push(date)
    }
  }
  return slots
}

export default function ScheduleMeetingModal({
  open,
  onClose,
  application,
  meeting,
  onSaved,
}) {
  const toast = useToast()
  const isEditing = Boolean(meeting)

  const [type, setType] = useState(
    meeting?.meeting_type ?? MEETING_TYPES.IN_PERSON,
  )
  const [when, setWhen] = useState(() =>
    toDatetimeLocal(
      meeting ? new Date(meeting.scheduled_at) : suggestedSlots()[0],
    ),
  )
  const [location, setLocation] = useState(meeting?.location_link ?? '')
  const [notes, setNotes] = useState(meeting?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)

  const isVirtual = type === MEETING_TYPES.VIRTUAL

  const submit = async () => {
    if (!location.trim()) {
      toast.error(isVirtual ? 'Add a meeting link' : 'Add an address')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        meeting_type: type,
        scheduled_at: new Date(when).toISOString(),
        location_link: location.trim(),
        notes: notes.trim() || undefined,
      }
      const saved = isEditing
        ? await meetingsApi.update(meeting.id, payload)
        : await meetingsApi.schedule({
            ...payload,
            application_id: application.id,
          })

      toast.success(isEditing ? 'Viewing updated' : 'Viewing scheduled')
      onSaved?.(saved)
      onClose()
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save the viewing'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Reschedule viewing' : 'Schedule a viewing'}
      description={application?.listing?.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting}>
            {isEditing ? 'Save changes' : 'Send request'}
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-soft">
          How would you like to meet?
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: MEETING_TYPES.IN_PERSON, icon: MapPin, label: 'In person' },
            { value: MEETING_TYPES.VIRTUAL, icon: Video, label: 'Video call' },
          ].map(({ value, icon: Icon, label }) => {
            const active = type === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                aria-pressed={active}
                className={[
                  'flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-all',
                  active
                    ? 'border-terracotta bg-terracotta/8 font-medium'
                    : 'border-tan bg-cream/40 hover:border-ochre',
                ].join(' ')}
              >
                <Icon
                  size={17}
                  className={active ? 'text-terracotta' : 'text-ochre'}
                />
                {label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="mt-5 space-y-4">
        <Input
          label="Date and time"
          type="datetime-local"
          value={when}
          min={toDatetimeLocal(new Date())}
          onChange={(event) => setWhen(event.target.value)}
          required
        />

        <div>
          <p className="mb-2 text-sm font-medium text-ink-soft">Quick picks</p>
          <div className="flex flex-wrap gap-2">
            {suggestedSlots()
              .slice(0, 6)
              .map((slot) => {
                const value = toDatetimeLocal(slot)
                const active = when === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setWhen(value)}
                    className={[
                      'cursor-pointer rounded-base border px-2.5 py-1 text-xs transition-colors',
                      active
                        ? 'border-terracotta bg-terracotta/10 text-terracotta-dark'
                        : 'border-tan text-ink-soft hover:border-ochre',
                    ].join(' ')}
                  >
                    {slot.toLocaleString('en-GB', {
                      weekday: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </button>
                )
              })}
          </div>
        </div>

        <Input
          label={isVirtual ? 'Meeting link' : 'Address'}
          icon={isVirtual ? LinkIcon : MapPin}
          placeholder={
            isVirtual
              ? 'https://meet.google.com/…'
              : '12 Rue de Fes, Tanger'
          }
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          required
        />

        <Textarea
          label="Notes (optional)"
          rows={3}
          maxLength={500}
          placeholder="Anything the other person should know — buzzer code, parking, what to bring."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>
    </Modal>
  )
}

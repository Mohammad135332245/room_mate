import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, CheckCheck, Send } from 'lucide-react'

import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { LoadingBlock } from '../../components/ui/Feedback'
import { STATUS_LABELS, STATUS_TONES } from '../../core/config/constants'
import { formatMonthlyPrice, formatTime, groupByDay } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'
import { useChat } from './useChat'

const CONNECTION_LABELS = {
  connecting: 'Connecting…',
  reconnecting: 'Reconnecting…',
  closed: 'Offline — messages will still send',
  error: 'Connection problem',
  unauthorized: 'You cannot join this conversation',
}

export default function ChatWindow({ application, onSchedule }) {
  const { user } = useAuth()
  const { messages, loading, error, status, peerTyping, send, notifyTyping } =
    useChat(application?.id, user?.id)

  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)

  const isOwner = application?.listing?.owner_id === user?.id
  const peer = isOwner ? application?.applicant : application?.listing?.owner

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, peerTyping])

  const submit = (event) => {
    event.preventDefault()
    if (!draft.trim()) return
    send(draft)
    setDraft('')
  }

  if (!application) return null

  const canSchedule =
    application.status === 'ACCEPTED' || application.status === 'MEETING_SCHEDULED'
  const connectionNote = CONNECTION_LABELS[status]

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-tan px-4 py-3">
        <Avatar user={peer} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-bold">{peer?.name}</p>
          <Link
            to={`/listings/${application.listing.id}`}
            className="block truncate text-sm text-ink-soft no-underline hover:text-terracotta"
          >
            {application.listing.title} ·{' '}
            {formatMonthlyPrice(application.listing.price)}
          </Link>
        </div>
        <Badge tone={STATUS_TONES[application.status]}>
          {STATUS_LABELS[application.status]}
        </Badge>
        {canSchedule && onSchedule && (
          <Button
            size="sm"
            variant="secondary"
            icon={CalendarPlus}
            onClick={() => onSchedule(application)}
            className="hidden sm:inline-flex"
          >
            Viewing
          </Button>
        )}
      </header>

      {connectionNote && (
        <p className="border-b border-tan bg-warning/10 px-4 py-1.5 text-center text-xs text-ink-soft">
          {connectionNote}
        </p>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto bg-cream/40 px-4 py-5">
        {loading ? (
          <LoadingBlock label="Loading conversation…" />
        ) : error ? (
          <p className="py-8 text-center text-sm text-danger">{error}</p>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-ink-soft">
              No messages yet — say hello and ask about the room.
            </p>
          </div>
        ) : (
          groupByDay(messages).map((group) => (
            <div key={group.key} className="space-y-2">
              <p className="text-center text-xs text-ink-muted">{group.label}</p>
              {group.items.map((message) => (
                <Bubble
                  key={message.id}
                  message={message}
                  mine={message.sender_id === user.id}
                />
              ))}
            </div>
          ))
        )}

        {peerTyping && (
          <p className="text-sm text-ink-muted italic">
            {peer?.name?.split(' ')[0]} is typing…
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={submit}
        className="flex items-end gap-2 border-t border-tan bg-shell px-4 py-3"
      >
        <textarea
          rows={1}
          value={draft}
          maxLength={2000}
          placeholder="Write a message…"
          aria-label="Message"
          onChange={(event) => {
            setDraft(event.target.value)
            notifyTyping()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) submit(event)
          }}
          className="max-h-32 flex-1 resize-none rounded-md border border-tan bg-cream/40 px-3 py-2.5 text-ink placeholder:text-ink-muted/70 focus:border-terracotta focus:outline-none"
        />
        <Button type="submit" icon={Send} disabled={!draft.trim()}>
          <span className="hidden sm:inline">Send</span>
        </Button>
      </form>
    </div>
  )
}

function Bubble({ message, mine }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[78%] rounded-lg px-3.5 py-2 text-sm',
          mine
            ? 'rounded-br-sm bg-terracotta text-shell'
            : 'rounded-bl-sm border border-tan bg-shell text-ink',
        ].join(' ')}
      >
        <p className="break-words whitespace-pre-wrap">{message.text}</p>
        <span
          className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${
            mine ? 'text-shell/70' : 'text-ink-muted'
          }`}
        >
          {formatTime(message.created_at)}
          {mine && message.read && <CheckCheck size={12} />}
        </span>
      </div>
    </div>
  )
}

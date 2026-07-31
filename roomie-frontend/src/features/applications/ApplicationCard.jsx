import { Link } from 'react-router-dom'
import { CalendarPlus, Check, MessageSquare, X } from 'lucide-react'

import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { STATUS_LABELS, STATUS_TONES } from '../../core/config/constants'
import { formatMonthlyPrice, formatRelative } from '../../utils/formatters'

/**
 * One application row. `perspective` decides whether the counterparty shown
 * is the applicant (owner view) or the listing owner (student view).
 */
export default function ApplicationCard({
  application,
  perspective = 'student',
  onAccept,
  onDecline,
  onSchedule,
  busy = false,
}) {
  const { listing, applicant, status } = application
  const isOwnerView = perspective === 'owner'
  const person = isOwnerView ? applicant : listing.owner
  const canRespond = isOwnerView && status === 'PENDING'
  const canSchedule =
    isOwnerView && (status === 'ACCEPTED' || status === 'MEETING_SCHEDULED')

  return (
    <div className="rounded-lg border border-tan bg-shell p-4 transition-colors hover:border-ochre">
      <div className="flex items-start gap-3">
        <Avatar user={person} size="md" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                to={`/listings/${listing.id}`}
                className="block truncate font-display font-bold text-ink no-underline hover:text-terracotta"
              >
                {listing.title}
              </Link>
              <p className="truncate text-sm text-ink-soft">
                {isOwnerView ? `From ${person?.name}` : `Owner: ${person?.name}`}
                {' · '}
                {formatMonthlyPrice(listing.price)}
              </p>
            </div>
            <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
          </div>

          {application.message && (
            <p className="mt-2.5 line-clamp-2 rounded-base border border-tan bg-cream/50 px-3 py-2 text-sm text-ink-soft">
              “{application.message}”
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="mr-auto text-xs text-ink-muted">
              Applied {formatRelative(application.created_at)}
            </span>

            {canRespond && (
              <>
                <Button
                  size="sm"
                  variant="success"
                  icon={Check}
                  disabled={busy}
                  onClick={() => onAccept?.(application)}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={X}
                  disabled={busy}
                  onClick={() => onDecline?.(application)}
                >
                  Decline
                </Button>
              </>
            )}

            {canSchedule && (
              <Button
                size="sm"
                variant="secondary"
                icon={CalendarPlus}
                onClick={() => onSchedule?.(application)}
              >
                {status === 'MEETING_SCHEDULED' ? 'New viewing' : 'Schedule viewing'}
              </Button>
            )}

            {status !== 'DECLINED' && (
              <Link to={`/messages/${application.id}`} className="no-underline">
                <Button size="sm" variant="ghost" icon={MessageSquare}>
                  Message
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

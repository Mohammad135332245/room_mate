import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageSquare } from 'lucide-react'

import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import ChatWindow from '../features/chat/ChatWindow'
import ScheduleMeetingModal from '../features/meetings/ScheduleMeetingModal'
import { EmptyState } from '../components/ui/Card'
import { LoadingBlock } from '../components/ui/Feedback'
import { applicationsApi } from '../core/api/endpoints'
import { errorMessage } from '../core/api/client'
import { formatRelative } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import { useModal } from '../hooks/useModal'
import { useNotifications } from '../context/NotificationContext'
import { useToast } from '../components/ui/Toast'

export default function MessagesPage() {
  const { applicationId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { refresh: refreshUnread } = useNotifications()

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const scheduleModal = useModal()

  useEffect(() => {
    applicationsApi
      .conversations()
      .then(setConversations)
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const active = useMemo(
    () => conversations.find((item) => item.id === applicationId) ?? null,
    [conversations, applicationId],
  )

  // Opening a thread clears its unread badge locally and refreshes the global one.
  useEffect(() => {
    if (!applicationId) return
    setConversations((current) =>
      current.map((item) =>
        item.id === applicationId ? { ...item, unread_count: 0 } : item,
      ),
    )
    const timer = setTimeout(refreshUnread, 800)
    return () => clearTimeout(timer)
  }, [applicationId, refreshUnread])

  if (loading) return <LoadingBlock label="Loading your messages…" />

  if (conversations.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="Chats open as soon as you apply to a room, or once a student applies to your listing."
          action={<Button onClick={() => navigate('/listings')}>Browse rooms</Button>}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-5 text-3xl">Messages</h1>

      <div className="grid h-[calc(100vh-15rem)] min-h-[520px] overflow-hidden rounded-xl border border-tan bg-shell md:grid-cols-[320px_1fr]">
        {/* Conversation list — hidden on mobile once a thread is open. */}
        <aside
          className={`overflow-y-auto border-tan md:block md:border-r ${
            applicationId ? 'hidden' : 'block'
          }`}
        >
          {conversations.map((conversation) => {
            const isOwner = conversation.listing.owner_id === user.id
            const peer = isOwner
              ? conversation.applicant
              : conversation.listing.owner
            const selected = conversation.id === applicationId

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => navigate(`/messages/${conversation.id}`)}
                className={[
                  'flex w-full cursor-pointer items-start gap-3 border-b border-tan px-4 py-3 text-left transition-colors',
                  selected ? 'bg-terracotta/8' : 'hover:bg-cream/60',
                ].join(' ')}
              >
                <Avatar user={peer} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{peer?.name}</p>
                    {conversation.last_message_at && (
                      <span className="shrink-0 text-[11px] text-ink-muted">
                        {formatRelative(conversation.last_message_at)}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-ink-muted">
                    {conversation.listing.title}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-ink-soft">
                    {conversation.last_message ?? 'No messages yet'}
                  </p>
                </div>
                {conversation.unread_count > 0 && (
                  <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-terracotta px-1.5 text-[11px] font-semibold text-shell">
                    {conversation.unread_count}
                  </span>
                )}
              </button>
            )
          })}
        </aside>

        <section className={`${applicationId ? 'flex' : 'hidden'} flex-col md:flex`}>
          {active ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/messages')}
                className="flex cursor-pointer items-center gap-1.5 border-b border-tan px-4 py-2 text-sm text-ink-soft md:hidden"
              >
                <ArrowLeft size={16} />
                All conversations
              </button>
              <div className="min-h-0 flex-1">
                <ChatWindow
                  application={active}
                  onSchedule={(application) => scheduleModal.show(application)}
                />
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <div>
                <MessageSquare size={34} className="mx-auto text-ochre" />
                <p className="mt-3 text-ink-soft">
                  Pick a conversation to start reading.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {scheduleModal.open && (
        <ScheduleMeetingModal
          open={scheduleModal.open}
          onClose={scheduleModal.hide}
          application={scheduleModal.payload}
          onSaved={() => toast.success('Viewing added to your dashboard')}
        />
      )}
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  CalendarDays,
  Eye,
  FileText,
  Heart,
  Home,
  MessageSquare,
  Pencil,
  PlusCircle,
  Trash2,
  Video,
} from 'lucide-react'

import ApplicationCard from '../features/applications/ApplicationCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card, { EmptyState } from '../components/ui/Card'
import ListingCard from '../features/listings/ListingCard'
import ScheduleMeetingModal from '../features/meetings/ScheduleMeetingModal'
import { ConfirmDialog } from '../components/ui/Modal'
import { LoadingBlock } from '../components/ui/Feedback'
import {
  applicationsApi,
  listingsApi,
  meetingsApi,
  usersApi,
} from '../core/api/endpoints'
import { errorMessage } from '../core/api/client'
import { formatDateTime, pluralize } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import { useModal } from '../hooks/useModal'
import { useToast } from '../components/ui/Toast'

const STUDENT_TABS = [
  { key: 'applications', label: 'My applications', icon: FileText },
  { key: 'saved', label: 'Saved rooms', icon: Heart },
  { key: 'meetings', label: 'Viewings', icon: CalendarDays },
]

const OWNER_TABS = [
  { key: 'listings', label: 'My listings', icon: Home },
  { key: 'applications', label: 'Applications', icon: FileText },
  { key: 'meetings', label: 'Viewings', icon: CalendarDays },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
]

export default function DashboardPage() {
  const { user, isLandlord } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const tabs = isLandlord ? OWNER_TABS : STUDENT_TABS
  const [tab, setTab] = useState(tabs[0].key)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const [stats, setStats] = useState(null)
  const [applications, setApplications] = useState([])
  const [listings, setListings] = useState([])
  const [saved, setSaved] = useState([])
  const [meetings, setMeetings] = useState([])

  const scheduleModal = useModal()
  const deleteModal = useModal()
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [statsData, applicationsData, meetingsData] = await Promise.all([
        usersApi.stats(),
        isLandlord ? applicationsApi.received() : applicationsApi.mine(),
        meetingsApi.list({ upcoming: true, status: 'SCHEDULED' }),
      ])
      setStats(statsData)
      setApplications(applicationsData)
      setMeetings(meetingsData)

      if (isLandlord) setListings(await listingsApi.mine())
      else setSaved(await listingsApi.saved())
    } catch (error) {
      toast.error(errorMessage(error, 'Could not load your dashboard'))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLandlord])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (application, status) => {
    setBusyId(application.id)
    try {
      const updated = await applicationsApi.setStatus(application.id, status)
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      toast.success(
        status === 'ACCEPTED' ? 'Application accepted' : 'Application declined',
      )
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusyId(null)
    }
  }

  const removeListing = async () => {
    setDeleting(true)
    try {
      await listingsApi.remove(deleteModal.payload.id)
      setListings((current) =>
        current.filter((item) => item.id !== deleteModal.payload.id),
      )
      toast.success('Listing deleted')
      deleteModal.hide()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setDeleting(false)
    }
  }

  const cancelMeeting = async (meeting) => {
    try {
      await meetingsApi.cancel(meeting.id)
      setMeetings((current) => current.filter((item) => item.id !== meeting.id))
      toast.success('Viewing cancelled')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  if (loading) return <LoadingBlock label="Loading your dashboard…" />

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Hi, {user.name.split(' ')[0]}</h1>
          <p className="mt-1.5 text-ink-soft">
            {isLandlord
              ? 'Manage your listings, applications and viewings.'
              : 'Track your applications, saved rooms and viewings.'}
          </p>
        </div>
        {isLandlord && (
          <Button icon={PlusCircle} onClick={() => navigate('/post-listing')}>
            Post a listing
          </Button>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLandlord ? (
          <>
            <StatTile icon={Home} label="Active listings" value={stats.listings_active} />
            <StatTile icon={FileText} label="Pending applications" value={stats.applications_pending} />
            <StatTile icon={Eye} label="Total views" value={stats.total_views} />
            <StatTile
              icon={MessageSquare}
              label="Unread messages"
              value={stats.unread_messages}
            />
          </>
        ) : (
          <>
            <StatTile icon={FileText} label="Applications" value={stats.applications_total} />
            <StatTile icon={Heart} label="Saved rooms" value={stats.saved_listings} />
            <StatTile icon={CalendarDays} label="Upcoming viewings" value={stats.upcoming_meetings} />
            <StatTile
              icon={MessageSquare}
              label="Unread messages"
              value={stats.unread_messages}
            />
          </>
        )}
      </div>

      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-tan">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-current={tab === key}
            className={[
              '-mb-px flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
              tab === key
                ? 'border-terracotta text-terracotta-dark'
                : 'border-transparent text-ink-soft hover:text-ink',
            ].join(' ')}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'applications' && (
          <ApplicationsTab
            applications={applications}
            isLandlord={isLandlord}
            busyId={busyId}
            onAccept={(application) => setStatus(application, 'ACCEPTED')}
            onDecline={(application) => setStatus(application, 'DECLINED')}
            onSchedule={(application) => scheduleModal.show(application)}
          />
        )}

        {tab === 'listings' && (
          <ListingsTab
            listings={listings}
            onEdit={(listing) => navigate(`/listings/${listing.id}/edit`)}
            onDelete={(listing) => deleteModal.show(listing)}
          />
        )}

        {tab === 'saved' && (
          <>
            {saved.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No saved rooms yet"
                description="Tap the heart on any listing to keep it here for later."
                action={
                  <Button onClick={() => navigate('/listings')}>
                    Browse rooms
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {saved.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'meetings' && (
          <MeetingsTab meetings={meetings} onCancel={cancelMeeting} />
        )}

        {tab === 'analytics' && <AnalyticsTab stats={stats} listings={listings} />}
      </div>

      {scheduleModal.open && (
        <ScheduleMeetingModal
          open={scheduleModal.open}
          onClose={scheduleModal.hide}
          application={scheduleModal.payload}
          onSaved={load}
        />
      )}

      <ConfirmDialog
        open={deleteModal.open}
        onClose={deleteModal.hide}
        onConfirm={removeListing}
        loading={deleting}
        title="Delete this listing?"
        message={`"${deleteModal.payload?.title}" and all of its applications will be removed. This cannot be undone.`}
        confirmLabel="Delete listing"
      />
    </div>
  )
}

function StatTile({ icon: Icon, label, value }) {
  return (
    <Card className="flex items-center gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-terracotta/12 text-terracotta">
        <Icon size={20} />
      </span>
      <div>
        <p className="font-display text-2xl font-bold">{value ?? 0}</p>
        <p className="text-sm text-ink-soft">{label}</p>
      </div>
    </Card>
  )
}

function ApplicationsTab({
  applications,
  isLandlord,
  busyId,
  onAccept,
  onDecline,
  onSchedule,
}) {
  if (applications.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title={isLandlord ? 'No applications yet' : 'You have not applied anywhere yet'}
        description={
          isLandlord
            ? 'Once students apply to your listings, they show up here.'
            : 'Find a room you like and send your first application.'
        }
        action={
          !isLandlord && (
            <Link to="/listings" className="no-underline">
              <Button>Browse rooms</Button>
            </Link>
          )
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      {applications.map((application) => (
        <ApplicationCard
          key={application.id}
          application={application}
          perspective={isLandlord ? 'owner' : 'student'}
          busy={busyId === application.id}
          onAccept={onAccept}
          onDecline={onDecline}
          onSchedule={onSchedule}
        />
      ))}
    </div>
  )
}

function ListingsTab({ listings, onEdit, onDelete }) {
  if (listings.length === 0) {
    return (
      <EmptyState
        icon={Home}
        title="You have no listings yet"
        description="Post your first room and start receiving applications from students."
        action={
          <Link to="/post-listing" className="no-underline">
            <Button icon={PlusCircle}>Post a listing</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <div key={listing.id} className="space-y-2">
          <ListingCard listing={listing} />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={Pencil}
              fullWidth
              onClick={() => onEdit(listing)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={Trash2}
              onClick={() => onDelete(listing)}
              aria-label={`Delete ${listing.title}`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function MeetingsTab({ meetings, onCancel }) {
  if (meetings.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No viewings scheduled"
        description="Once an application is accepted, you can agree on a time to visit."
      />
    )
  }

  return (
    <div className="space-y-3">
      {meetings.map((meeting) => (
        <Card key={meeting.id} className="flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-sage/15 text-sage-dark">
            {meeting.meeting_type === 'VIRTUAL' ? (
              <Video size={20} />
            ) : (
              <CalendarDays size={20} />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-display font-bold">
              {formatDateTime(meeting.scheduled_at)}
            </p>
            <p className="truncate text-sm text-ink-soft">
              {meeting.meeting_type === 'VIRTUAL' ? 'Video call' : 'In person'}
              {meeting.location_link && ` · ${meeting.location_link}`}
            </p>
            {meeting.notes && (
              <p className="mt-1 text-sm text-ink-muted">{meeting.notes}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge tone="success">Scheduled</Badge>
            <Button size="sm" variant="secondary" onClick={() => onCancel(meeting)}>
              Cancel
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

function AnalyticsTab({ stats, listings }) {
  const rows = [
    { label: 'Total listings', value: stats.listings_total },
    { label: 'Active listings', value: stats.listings_active },
    { label: 'Total views', value: stats.total_views },
    { label: 'Applications received', value: stats.applications_total },
    { label: 'Applications this week', value: stats.applications_this_week },
    {
      label: 'Response rate',
      value: stats.response_rate == null ? '—' : `${stats.response_rate}%`,
    },
    {
      label: 'Owner rating',
      value:
        stats.rating == null
          ? 'No reviews yet'
          : `${stats.rating} (${pluralize(stats.reviews_count, 'review')})`,
    },
  ]

  const mostViewed = [...listings]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h3 className="mb-4 text-lg">At a glance</h3>
        <dl className="divide-y divide-tan">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-ink-soft">{label}</dt>
              <dd className="font-display font-bold">{value ?? 0}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <h3 className="mb-4 text-lg">Most viewed listings</h3>
        {mostViewed.length === 0 ? (
          <p className="text-sm text-ink-soft">No listings to compare yet.</p>
        ) : (
          <ul className="space-y-3">
            {mostViewed.map((listing) => {
              const max = mostViewed[0].views || 1
              return (
                <li key={listing.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      to={`/listings/${listing.id}`}
                      className="truncate text-sm text-ink no-underline hover:text-terracotta"
                    >
                      {listing.title}
                    </Link>
                    <span className="shrink-0 text-sm text-ink-muted">
                      {listing.views}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-tan-soft">
                    <div
                      className="h-full rounded-full bg-terracotta"
                      style={{ width: `${(listing.views / max) * 100}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

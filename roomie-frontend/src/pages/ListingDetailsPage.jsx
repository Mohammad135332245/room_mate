import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Bath,
  BedDouble,
  Check,
  Heart,
  Home,
  MapPin,
  Pencil,
  School,
  Trash2,
  Users,
} from 'lucide-react'

import ApplyModal from '../features/applications/ApplyModal'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ListingCard from '../features/listings/ListingCard'
import PhotoGallery from '../features/listings/PhotoGallery'
import { ConfirmDialog } from '../components/ui/Modal'
import { LoadingBlock, Rating } from '../components/ui/Feedback'
import { errorMessage } from '../core/api/client'
import { formatDate, formatMonthlyPrice } from '../utils/formatters'
import { listingsApi, usersApi } from '../core/api/endpoints'
import { useAuth } from '../context/AuthContext'
import { useModal } from '../hooks/useModal'
import { useToast } from '../components/ui/Toast'

export default function ListingDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user, isAuthenticated, isStudent } = useAuth()

  const [listing, setListing] = useState(null)
  const [related, setRelated] = useState([])
  const [ownerProfile, setOwnerProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const applyModal = useModal()
  const deleteModal = useModal()
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    listingsApi
      .detail(id)
      .then((data) => {
        if (cancelled) return
        setListing(data)
        listingsApi.related(id).then((items) => !cancelled && setRelated(items))
        usersApi
          .profile(data.owner_id)
          .then((profile) => !cancelled && setOwnerProfile(profile))
          .catch(() => {})
      })
      .catch((error) => {
        if (cancelled) return
        toast.error(errorMessage(error, 'Listing not found'))
        navigate('/listings', { replace: true })
      })
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const isOwner = user?.id === listing?.owner_id

  const toggleSave = async () => {
    if (!isAuthenticated) {
      toast.info('Sign in to save listings')
      return
    }
    setSaving(true)
    try {
      if (listing.is_saved) {
        await listingsApi.unsave(listing.id)
        setListing((current) => ({ ...current, is_saved: false }))
        toast.info('Removed from saved')
      } else {
        await listingsApi.save(listing.id)
        setListing((current) => ({ ...current, is_saved: true }))
        toast.success('Saved to your list')
      }
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setDeleting(true)
    try {
      await listingsApi.remove(listing.id)
      toast.success('Listing deleted')
      navigate('/dashboard')
    } catch (error) {
      toast.error(errorMessage(error))
      setDeleting(false)
    }
  }

  const apply = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/listings/${id}` } } })
      return
    }
    applyModal.show()
  }

  if (loading) return <LoadingBlock label="Loading this room…" />
  if (!listing) return null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-4 text-sm text-ink-muted">
        <Link to="/listings" className="no-underline hover:text-terracotta">
          Browse rooms
        </Link>
        <span className="mx-2">/</span>
        <Link
          to={`/listings?city=${listing.city}`}
          className="no-underline hover:text-terracotta"
        >
          {listing.city}
        </Link>
      </nav>

      <PhotoGallery photos={listing.photos} title={listing.title} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl">{listing.title}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-ink-soft">
                <MapPin size={16} className="text-ochre" />
                {listing.address ?? listing.city}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-bold text-terracotta">
                {formatMonthlyPrice(listing.price)}
              </p>
              <p className="text-sm text-ink-muted">
                Listed {formatDate(listing.created_at)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Badge tone={listing.furnished ? 'success' : 'neutral'}>
              {listing.furnished ? 'Furnished' : 'Unfurnished'}
            </Badge>
            {listing.campus_proximity && (
              <Badge tone="primary" icon={School}>
                {listing.campus_proximity}
              </Badge>
            )}
            <Badge tone="info" icon={Users}>
              {listing.applications_count} applied
            </Badge>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg border border-tan bg-shell p-5">
            <Stat icon={BedDouble} label="Rooms" value={listing.rooms} />
            <Stat icon={Bath} label="Bathrooms" value={listing.bathrooms} />
            <Stat
              icon={Home}
              label="Type"
              value={listing.rooms > 1 ? 'Apartment' : 'Studio'}
            />
          </div>

          <section className="mt-8">
            <h2 className="text-xl">About this place</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-ink-soft">
              {listing.description}
            </p>
          </section>

          {listing.amenities?.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl">What&apos;s included</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {listing.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="flex items-center gap-2 text-sm text-ink-soft"
                  >
                    <Check size={15} className="shrink-0 text-sage" />
                    {amenity}
                  </span>
                ))}
              </div>
            </section>
          )}

          {(listing.latitude || listing.address) && (
            <section className="mt-8">
              <h2 className="text-xl">Location</h2>
              <div className="mt-3 flex h-52 items-center justify-center rounded-lg border border-tan bg-tan-soft/60 text-center">
                <div>
                  <MapPin size={26} className="mx-auto text-ochre" />
                  <p className="mt-2 text-sm text-ink-soft">
                    {listing.address ?? listing.city}
                  </p>
                  {listing.latitude != null && (
                    <p className="text-xs text-ink-muted">
                      {listing.latitude.toFixed(4)},{' '}
                      {listing.longitude?.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* ---- Sticky action rail ---- */}
        <div className="lg:sticky lg:top-20 lg:h-fit">
          <Card>
            <div className="flex items-center gap-3">
              <Avatar user={listing.owner} size="lg" />
              <div className="min-w-0">
                <Link
                  to={`/users/${listing.owner_id}`}
                  className="block truncate font-display font-bold text-ink no-underline hover:text-terracotta"
                >
                  {listing.owner.name}
                </Link>
                <p className="text-sm text-ink-muted">Property owner</p>
                {ownerProfile && (
                  <Rating
                    value={ownerProfile.rating}
                    count={ownerProfile.reviews_count}
                    className="mt-1"
                  />
                )}
              </div>
            </div>

            {ownerProfile?.bio && (
              <p className="mt-4 border-t border-tan pt-4 text-sm text-ink-soft">
                {ownerProfile.bio}
              </p>
            )}

            <div className="mt-5 space-y-2.5">
              {isOwner ? (
                <>
                  <Button
                    fullWidth
                    icon={Pencil}
                    onClick={() => navigate(`/listings/${listing.id}/edit`)}
                  >
                    Edit listing
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    icon={Trash2}
                    onClick={deleteModal.show}
                  >
                    Delete listing
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    fullWidth
                    size="lg"
                    onClick={apply}
                    disabled={listing.has_applied || (isAuthenticated && !isStudent)}
                  >
                    {listing.has_applied
                      ? 'Application sent'
                      : 'Submit application'}
                  </Button>
                  {isStudent && (
                    <Button
                      variant="secondary"
                      fullWidth
                      icon={Heart}
                      loading={saving}
                      onClick={toggleSave}
                    >
                      {listing.is_saved ? 'Saved' : 'Save for later'}
                    </Button>
                  )}
                  {isAuthenticated && !isStudent && (
                    <p className="text-center text-xs text-ink-muted">
                      Only student accounts can apply to listings.
                    </p>
                  )}
                </>
              )}
            </div>

            <p className="mt-4 border-t border-tan pt-4 text-center text-xs text-ink-muted">
              {listing.views} {listing.views === 1 ? 'view' : 'views'} so far
            </p>
          </Card>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl">Similar rooms in {listing.city}</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      )}

      <ApplyModal
        open={applyModal.open}
        onClose={applyModal.hide}
        listing={listing}
        onApplied={() =>
          setListing((current) => ({
            ...current,
            has_applied: true,
            applications_count: current.applications_count + 1,
          }))
        }
      />

      <ConfirmDialog
        open={deleteModal.open}
        onClose={deleteModal.hide}
        onConfirm={remove}
        loading={deleting}
        title="Delete this listing?"
        message="This removes the listing along with its applications and conversations. It cannot be undone."
        confirmLabel="Delete listing"
      />
    </div>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="text-center">
      <Icon size={20} className="mx-auto text-ochre" />
      <p className="mt-1.5 font-display text-lg font-bold">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MapPin } from 'lucide-react'

import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import ListingCard from '../features/listings/ListingCard'
import { LoadingBlock, Rating } from '../components/ui/Feedback'
import { ROLES } from '../core/config/constants'
import { errorMessage } from '../core/api/client'
import { formatDate, pluralize } from '../utils/formatters'
import { listingsApi, usersApi } from '../core/api/endpoints'
import { useToast } from '../components/ui/Toast'

export default function PublicProfilePage() {
  const { id } = useParams()
  const toast = useToast()

  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    usersApi
      .profile(id)
      .then(async (data) => {
        if (cancelled) return
        setProfile(data)
        usersApi.reviews(id).then((items) => !cancelled && setReviews(items))

        if (data.role === ROLES.LANDLORD) {
          // No public "listings by owner" endpoint, so filter their city page.
          const page = await listingsApi.browse({
            city: data.city ?? undefined,
            page_size: 50,
          })
          if (!cancelled) {
            setListings(page.items.filter((item) => item.owner_id === id))
          }
        }
      })
      .catch((error) => !cancelled && toast.error(errorMessage(error)))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) return <LoadingBlock label="Loading profile…" />
  if (!profile) return null

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Card className="flex flex-wrap items-start gap-5">
        <Avatar user={profile} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl">{profile.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Badge tone={profile.role === ROLES.LANDLORD ? 'primary' : 'info'}>
              {profile.role === ROLES.LANDLORD ? 'Property owner' : 'Student'}
            </Badge>
            {profile.city && (
              <span className="flex items-center gap-1 text-sm text-ink-soft">
                <MapPin size={14} className="text-ochre" />
                {profile.city}
              </span>
            )}
            <span className="text-sm text-ink-muted">
              Joined {formatDate(profile.created_at, { day: undefined })}
            </span>
          </div>
          <Rating
            value={profile.rating}
            count={profile.reviews_count}
            className="mt-2"
          />
          {profile.bio && (
            <p className="mt-4 text-ink-soft">{profile.bio}</p>
          )}
        </div>
      </Card>

      {profile.role === ROLES.LANDLORD && listings.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl">
            {pluralize(listings.length, 'active listing')}
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-2xl">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-ink-soft">No reviews yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {reviews.map((review) => (
              <Card key={review.id}>
                <div className="flex items-center gap-3">
                  <Avatar user={review.reviewer} size="sm" />
                  <div>
                    <p className="text-sm font-semibold">{review.reviewer.name}</p>
                    <p className="text-xs text-ink-muted">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                  <Rating value={review.rating} className="ml-auto" />
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm text-ink-soft">{review.comment}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

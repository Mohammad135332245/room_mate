import { Link } from 'react-router-dom'
import { Bath, BedDouble, Heart, MapPin } from 'lucide-react'

import Badge from '../../components/ui/Badge'
import { formatMonthlyPrice, resolveImage } from '../../utils/formatters'

function Placeholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-tan-soft">
      <svg
        viewBox="0 0 24 24"
        className="h-10 w-10 text-ochre/60"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M3 10.5 12 3l9 7.5V21H3V10.5Z" />
        <path d="M9 21v-6h6v6" />
      </svg>
    </div>
  )
}

export default function ListingCard({ listing, saved, onToggleSave }) {
  const cover = resolveImage(listing.photos?.[0])

  return (
    <article className="group overflow-hidden rounded-lg border border-tan bg-shell shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-ochre hover:shadow-[var(--shadow-lift)]">
      <Link to={`/listings/${listing.id}`} className="block no-underline">
        <div className="relative h-48 overflow-hidden">
          {cover ? (
            <img
              src={cover}
              alt={listing.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <Placeholder />
          )}

          <span className="absolute bottom-3 left-3 rounded-md bg-shell/95 px-2.5 py-1 font-display text-sm font-bold text-terracotta shadow-sm">
            {formatMonthlyPrice(listing.price)}
          </span>

          {listing.furnished && (
            <Badge tone="success" className="absolute top-3 left-3 bg-shell/95">
              Furnished
            </Badge>
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/listings/${listing.id}`}
            className="line-clamp-2 font-display text-base font-bold text-ink no-underline transition-colors hover:text-terracotta"
          >
            {listing.title}
          </Link>

          {onToggleSave && (
            <button
              type="button"
              onClick={() => onToggleSave(listing)}
              aria-label={saved ? 'Remove from saved' : 'Save listing'}
              aria-pressed={Boolean(saved)}
              className="shrink-0 cursor-pointer rounded-full p-1.5 text-ink-muted transition-colors hover:bg-tan-soft hover:text-terracotta"
            >
              <Heart
                size={18}
                className={saved ? 'fill-terracotta text-terracotta' : ''}
              />
            </button>
          )}
        </div>

        <p className="mt-1.5 flex items-center gap-1 text-sm text-ink-soft">
          <MapPin size={14} className="shrink-0 text-ochre" />
          <span className="truncate">
            {listing.campus_proximity
              ? `${listing.campus_proximity} · ${listing.city}`
              : listing.city}
          </span>
        </p>

        <div className="mt-3 flex items-center gap-4 border-t border-tan pt-3 text-sm text-ink-soft">
          <span className="flex items-center gap-1.5">
            <BedDouble size={15} className="text-ochre" />
            {listing.rooms} {listing.rooms === 1 ? 'room' : 'rooms'}
          </span>
          <span className="flex items-center gap-1.5">
            <Bath size={15} className="text-ochre" />
            {listing.bathrooms}
          </span>
          {listing.amenities?.length > 0 && (
            <span className="ml-auto truncate text-xs text-ink-muted">
              {listing.amenities.slice(0, 2).join(' · ')}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

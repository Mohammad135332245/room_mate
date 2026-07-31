import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ListingCard from '../features/listings/ListingCard'
import { CrescentAccent, ListingCardSkeleton } from '../components/ui/Feedback'
import { Select } from '../components/ui/Input'
import { DEFAULT_CITY } from '../core/config/constants'
import { listingsApi } from '../core/api/endpoints'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../context/AuthContext'
import { useListingMeta } from '../hooks/useListingMeta'

const STEPS = [
  {
    icon: Search,
    title: 'Search near your campus',
    body: 'Filter by city, university, budget and the amenities you actually need.',
  },
  {
    icon: MessageCircle,
    title: 'Talk to the owner',
    body: 'Apply in one click, then chat directly — no agencies, no middlemen.',
  },
  {
    icon: CalendarCheck,
    title: 'Book a viewing',
    body: 'Agree on a time in person or over video, and move in with confidence.',
  },
]

const TESTIMONIALS = [
  {
    quote:
      'I found a studio ten minutes from EMSI in three days. Talking to the owner directly made all the difference.',
    name: 'Yasmine A.',
    detail: 'Engineering student, Tanger',
  },
  {
    quote:
      'As an owner I stopped juggling phone calls. Applications arrive in one place and I answer when I can.',
    name: 'Hassan B.',
    detail: 'Property owner, Tanger',
  },
  {
    quote:
      'The filters saved me hours. I set my budget, picked my campus, and only saw places that fit.',
    name: 'Salma B.',
    detail: 'Medicine student, Casablanca',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLandlord } = useAuth()
  const { cities, campusesFor } = useListingMeta()

  const [city, setCity] = useState(DEFAULT_CITY)
  const [campus, setCampus] = useState('')

  const { data: featured, loading } = useAsync(() => listingsApi.featured(4), [])

  const search = (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    if (campus) params.set('campus', campus)
    navigate(`/listings?${params}`)
  }

  return (
    <>
      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden border-b border-tan bg-shell">
        <div className="zellige pointer-events-none absolute inset-0" />
        <CrescentAccent className="pointer-events-none absolute -top-8 -right-10 h-56 w-56" />

        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 md:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-terracotta/30 bg-terracotta/10 px-3 py-1 text-xs font-medium text-terracotta-dark">
            <Sparkles size={13} />
            Now serving students in {cities.length} Moroccan cities
          </span>

          <h1 className="mt-5 text-4xl leading-tight md:text-6xl">
            Find your perfect room
            <span className="block text-terracotta">in Morocco</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-soft">
            Student housing near every major campus — browse verified rooms,
            message owners directly, and schedule a viewing in minutes.
          </p>

          <form
            onSubmit={search}
            className="mx-auto mt-9 flex max-w-2xl flex-col gap-3 rounded-xl border border-tan bg-shell p-3 shadow-[var(--shadow-lift)] sm:flex-row"
          >
            <Select
              value={city}
              options={cities}
              placeholder="Any city"
              aria-label="City"
              onChange={(event) => {
                setCity(event.target.value)
                setCampus('')
              }}
            />
            <Select
              value={campus}
              options={campusesFor(city)}
              placeholder="Any campus"
              aria-label="Campus"
              disabled={!city}
              onChange={(event) => setCampus(event.target.value)}
            />
            <Button type="submit" size="lg" icon={Search} className="sm:px-8">
              Search
            </Button>
          </form>

          {!isAuthenticated && (
            <p className="mt-6 text-sm text-ink-soft">
              Own a place?{' '}
              <Link
                to="/register"
                className="font-medium text-terracotta no-underline hover:underline"
              >
                List it for free
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* ---- Featured ---- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl">Rooms students are viewing</h2>
            <p className="mt-1.5 text-ink-soft">
              The most-visited listings across Morocco this week.
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/listings')}>
            See all
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }, (_, index) => (
                <ListingCardSkeleton key={index} />
              ))
            : (featured ?? []).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
        </div>

        {!loading && featured?.length === 0 && (
          <Card className="text-center text-ink-soft">
            No listings yet — be the first to post one.
          </Card>
        )}
      </section>

      {/* ---- How it works ---- */}
      <section className="border-y border-tan bg-shell">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl">How RoomieMA works</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-ink-soft">
            Three steps between you and a room near campus.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, index) => (
              <div key={title} className="relative rounded-lg border border-tan bg-cream/40 p-6">
                <span className="absolute top-5 right-5 font-display text-4xl font-bold text-tan">
                  {index + 1}
                </span>
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-terracotta/12 text-terracotta">
                  <Icon size={22} />
                </span>
                <h3 className="text-lg">{title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Testimonials ---- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl">Students and owners on RoomieMA</h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map(({ quote, name, detail }) => (
            <Card key={name} className="flex flex-col">
              <span className="font-display text-5xl leading-none text-tan">“</span>
              <p className="-mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
                {quote}
              </p>
              <div className="mt-4 border-t border-tan pt-3">
                <p className="text-sm font-semibold">{name}</p>
                <p className="text-xs text-ink-muted">{detail}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ---- Closing CTA ---- */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <div className="relative overflow-hidden rounded-xl bg-terracotta px-6 py-14 text-center">
          <div className="zellige pointer-events-none absolute inset-0 opacity-[0.07]" />
          <ShieldCheck
            size={200}
            className="pointer-events-none absolute -right-10 -bottom-16 text-shell/10"
          />

          <h2 className="relative text-3xl text-shell">
            {isLandlord ? 'Fill your rooms faster' : 'Ready to find your room?'}
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-shell/85">
            {isLandlord
              ? 'Post a listing and start receiving applications from students near your building today.'
              : 'Create a free account and start applying to rooms near your campus today.'}
          </p>
          <div className="relative mt-7 flex justify-center gap-3">
            {isLandlord ? (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/post-listing')}
              >
                Post your listing
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/listings')}
                >
                  Start searching
                </Button>
                {!isAuthenticated && (
                  <Button
                    variant="success"
                    size="lg"
                    onClick={() => navigate('/register')}
                  >
                    Create an account
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

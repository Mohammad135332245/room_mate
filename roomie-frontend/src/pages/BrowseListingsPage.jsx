import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'

import Button from '../components/ui/Button'
import FilterSidebar from '../features/listings/FilterSidebar'
import Input, { Select } from '../components/ui/Input'
import ListingCard from '../features/listings/ListingCard'
import { EmptyState } from '../components/ui/Card'
import { ListingCardSkeleton } from '../components/ui/Feedback'
import { PAGE_SIZE, SORT_OPTIONS } from '../core/config/constants'
import { errorMessage } from '../core/api/client'
import { listingsApi } from '../core/api/endpoints'
import { pluralize } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../components/ui/Toast'

/** URL search params are the source of truth so filters stay shareable. */
function paramsToFilters(params) {
  const amenities = params.getAll('amenities')
  return {
    city: params.get('city') ?? undefined,
    campus: params.get('campus') ?? undefined,
    price_min: params.get('price_min') ?? undefined,
    price_max: params.get('price_max') ?? undefined,
    rooms: params.get('rooms') ?? undefined,
    furnished: params.get('furnished') === 'true' ? true : undefined,
    amenities: amenities.length ? amenities : undefined,
    search: params.get('search') ?? undefined,
    sort: params.get('sort') ?? 'newest',
    page: Number(params.get('page') ?? 1),
  }
}

function filtersToParams(filters) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value == null || value === '' || value === false) return
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item))
    else params.set(key, String(value))
  })
  return params
}

export default function BrowseListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated, isStudent } = useAuth()
  const toast = useToast()

  const filters = useMemo(() => paramsToFilters(searchParams), [searchParams])

  const [searchInput, setSearchInput] = useState(filters.search ?? '')
  const debouncedSearch = useDebounce(searchInput, 400)

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savedIds, setSavedIds] = useState(new Set())
  const [filtersOpen, setFiltersOpen] = useState(false)

  const applyFilters = useCallback(
    (next) => setSearchParams(filtersToParams(next), { replace: true }),
    [setSearchParams],
  )

  // Typing in the search box updates the URL once the input settles.
  useEffect(() => {
    const current = filters.search ?? ''
    if (debouncedSearch === current) return
    applyFilters({ ...filters, search: debouncedSearch || undefined, page: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    listingsApi
      .browse({ ...filters, page_size: PAGE_SIZE })
      .then((data) => !cancelled && setResult(data))
      .catch((error) => !cancelled && toast.error(errorMessage(error)))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    if (!isStudent) return
    listingsApi
      .saved()
      .then((saved) => setSavedIds(new Set(saved.map((item) => item.id))))
      .catch(() => setSavedIds(new Set()))
  }, [isStudent])

  const toggleSave = async (listing) => {
    if (!isAuthenticated) {
      toast.info('Sign in to save listings')
      return
    }
    const alreadySaved = savedIds.has(listing.id)
    try {
      if (alreadySaved) {
        await listingsApi.unsave(listing.id)
        setSavedIds((current) => {
          const next = new Set(current)
          next.delete(listing.id)
          return next
        })
        toast.info('Removed from saved')
      } else {
        await listingsApi.save(listing.id)
        setSavedIds((current) => new Set(current).add(listing.id))
        toast.success('Saved to your list')
      }
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const total = result?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const activeCount = [
    filters.city,
    filters.campus,
    filters.price_min,
    filters.price_max,
    filters.rooms,
    filters.furnished,
    ...(filters.amenities ?? []),
  ].filter(Boolean).length

  const reset = () => {
    setSearchInput('')
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl">Browse rooms</h1>
        <p className="mt-1.5 text-ink-soft">
          {loading
            ? 'Searching…'
            : `${pluralize(total, 'room')} available${
                filters.city ? ` in ${filters.city}` : ' across Morocco'
              }`}
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Search by title, neighbourhood or campus…"
            value={searchInput}
            aria-label="Search listings"
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Select
            aria-label="Sort listings"
            value={filters.sort}
            options={SORT_OPTIONS}
            onChange={(event) =>
              applyFilters({ ...filters, sort: event.target.value, page: 1 })
            }
            className="sm:w-52"
          />
          <Button
            variant="secondary"
            icon={filtersOpen ? X : SlidersHorizontal}
            onClick={() => setFiltersOpen((open) => !open)}
            className="lg:hidden"
          >
            Filters{activeCount > 0 && ` (${activeCount})`}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <FilterSidebar
          filters={filters}
          onChange={applyFilters}
          onReset={reset}
          className={`h-fit lg:sticky lg:top-20 lg:block ${
            filtersOpen ? 'block' : 'hidden'
          }`}
        />

        <div>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <ListingCardSkeleton key={index} />
              ))}
            </div>
          ) : total === 0 ? (
            <EmptyState
              icon={Search}
              title="No rooms match your search"
              description="Try widening your budget, clearing a filter, or searching a nearby city."
              action={
                <Button variant="secondary" onClick={reset}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    saved={savedIds.has(listing.id)}
                    onToggleSave={isStudent ? toggleSave : undefined}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  aria-label="Pagination"
                  className="mt-10 flex items-center justify-center gap-2"
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={filters.page <= 1}
                    onClick={() =>
                      applyFilters({ ...filters, page: filters.page - 1 })
                    }
                  >
                    Previous
                  </Button>
                  <span className="px-3 text-sm text-ink-soft">
                    Page {filters.page} of {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={filters.page >= totalPages}
                    onClick={() =>
                      applyFilters({ ...filters, page: filters.page + 1 })
                    }
                  >
                    Next
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

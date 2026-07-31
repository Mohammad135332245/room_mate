import { useEffect, useState } from 'react'

import { listingsApi } from '../core/api/endpoints'
import { CITIES } from '../core/config/constants'

const FALLBACK = { cities: CITIES, campuses: {}, amenities: [] }

// Cities/campuses/amenities barely change, so cache them for the session.
let cache = null
let inFlight = null

/** Cities, campuses and amenities used to build filter and form controls. */
export function useListingMeta() {
  const [meta, setMeta] = useState(cache ?? FALLBACK)

  useEffect(() => {
    if (cache) return
    let cancelled = false

    inFlight = inFlight ?? listingsApi.meta()
    inFlight
      .then((data) => {
        cache = data
        if (!cancelled) setMeta(data)
      })
      .catch(() => {
        // Keep the hard-coded fallback so filters still work offline.
      })
      .finally(() => {
        inFlight = null
      })

    return () => {
      cancelled = true
    }
  }, [])

  const campusesFor = (city) => meta.campuses?.[city] ?? []
  const allCampuses = Object.values(meta.campuses ?? {}).flat()

  return { ...meta, campusesFor, allCampuses }
}

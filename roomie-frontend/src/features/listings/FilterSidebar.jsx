import { SlidersHorizontal, X } from 'lucide-react'

import Button from '../../components/ui/Button'
import Input, { Checkbox, Select, Switch } from '../../components/ui/Input'
import { useListingMeta } from '../../hooks/useListingMeta'

export default function FilterSidebar({ filters, onChange, onReset, className = '' }) {
  const { cities, amenities, campusesFor } = useListingMeta()
  const campuses = filters.city ? campusesFor(filters.city) : []

  const set = (patch) => onChange({ ...filters, ...patch, page: 1 })

  const toggleAmenity = (amenity) => {
    const current = filters.amenities ?? []
    set({
      amenities: current.includes(amenity)
        ? current.filter((item) => item !== amenity)
        : [...current, amenity],
    })
  }

  return (
    <aside className={`rounded-lg border border-tan bg-shell p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base">
          <SlidersHorizontal size={16} className="text-terracotta" />
          Filters
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="flex cursor-pointer items-center gap-1 text-xs text-ink-muted transition-colors hover:text-terracotta"
        >
          <X size={13} />
          Clear
        </button>
      </div>

      <div className="space-y-4">
        <Select
          label="City"
          placeholder="Anywhere in Morocco"
          value={filters.city ?? ''}
          options={cities}
          onChange={(event) =>
            // Campus choices depend on the city, so reset it together.
            set({ city: event.target.value || undefined, campus: undefined })
          }
        />

        {campuses.length > 0 && (
          <Select
            label="Campus"
            placeholder="Any campus"
            value={filters.campus ?? ''}
            options={campuses}
            onChange={(event) => set({ campus: event.target.value || undefined })}
          />
        )}

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-ink-soft">
            Monthly budget (DH)
          </legend>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              placeholder="Min"
              value={filters.price_min ?? ''}
              onChange={(event) =>
                set({ price_min: event.target.value || undefined })
              }
            />
            <span className="text-ink-muted">–</span>
            <Input
              type="number"
              min="0"
              placeholder="Max"
              value={filters.price_max ?? ''}
              onChange={(event) =>
                set({ price_max: event.target.value || undefined })
              }
            />
          </div>
        </fieldset>

        <Select
          label="Minimum rooms"
          placeholder="Any"
          value={filters.rooms ?? ''}
          options={[1, 2, 3, 4].map((n) => ({
            value: String(n),
            label: `${n}+ rooms`,
          }))}
          onChange={(event) => set({ rooms: event.target.value || undefined })}
        />

        <div className="border-t border-tan pt-4">
          <Switch
            label="Furnished only"
            checked={filters.furnished === true}
            onChange={(event) =>
              set({ furnished: event.target.checked ? true : undefined })
            }
          />
        </div>

        {amenities.length > 0 && (
          <fieldset className="border-t border-tan pt-4">
            <legend className="mb-2 text-sm font-medium text-ink-soft">
              Amenities
            </legend>
            <div className="space-y-2">
              {amenities.map((amenity) => (
                <Checkbox
                  key={amenity}
                  label={amenity}
                  checked={(filters.amenities ?? []).includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                />
              ))}
            </div>
          </fieldset>
        )}

        <Button variant="secondary" fullWidth onClick={onReset}>
          Reset all filters
        </Button>
      </div>
    </aside>
  )
}

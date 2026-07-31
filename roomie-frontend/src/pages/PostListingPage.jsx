import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ImagePlus, Upload, X } from 'lucide-react'

import Button from '../components/ui/Button'
import Card, { CardHeader } from '../components/ui/Card'
import Input, { Checkbox, Select, Switch, Textarea } from '../components/ui/Input'
import ListingCard from '../features/listings/ListingCard'
import { LoadingBlock } from '../components/ui/Feedback'
import { errorMessage } from '../core/api/client'
import { listingsApi } from '../core/api/endpoints'
import { useAuth } from '../context/AuthContext'
import { useListingMeta } from '../hooks/useListingMeta'
import { useToast } from '../components/ui/Toast'

const EMPTY = {
  title: '',
  description: '',
  price: '',
  city: '',
  campus_proximity: '',
  rooms: 1,
  bathrooms: 1,
  furnished: false,
  amenities: [],
  address: '',
}

export default function PostListingPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { cities, amenities, campusesFor } = useListingMeta()

  const [form, setForm] = useState(EMPTY)
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [existingPhotos, setExistingPhotos] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isEditing) return
    listingsApi
      .detail(id)
      .then((listing) => {
        setForm({
          title: listing.title,
          description: listing.description,
          price: String(listing.price),
          city: listing.city,
          campus_proximity: listing.campus_proximity ?? '',
          rooms: listing.rooms,
          bathrooms: listing.bathrooms,
          furnished: listing.furnished,
          amenities: listing.amenities ?? [],
          address: listing.address ?? '',
        })
        setExistingPhotos(listing.photos ?? [])
      })
      .catch((error) => {
        toast.error(errorMessage(error, 'Could not load that listing'))
        navigate('/dashboard')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Object URLs must be revoked or the browser holds the blobs.
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach(URL.revokeObjectURL)
  }, [files])

  const set = (field) => (event) => {
    const value =
      event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const toggleAmenity = (amenity) =>
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }))

  const addFiles = (incoming) => {
    const images = Array.from(incoming).filter((file) =>
      file.type.startsWith('image/'),
    )
    setFiles((current) => [...current, ...images].slice(0, 12))
  }

  const validate = () => {
    const next = {}
    if (form.title.trim().length < 6) next.title = 'At least 6 characters'
    if (form.description.trim().length < 20)
      next.description = 'Describe the place in at least 20 characters'
    if (!form.price || Number(form.price) <= 0)
      next.price = 'Enter a monthly price in DH'
    if (!form.city) next.city = 'Pick a city'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!validate()) {
      toast.error('Please fix the highlighted fields')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        rooms: Number(form.rooms),
        bathrooms: Number(form.bathrooms),
        campus_proximity: form.campus_proximity || undefined,
        address: form.address || undefined,
      }

      const listing = isEditing
        ? await listingsApi.update(id, payload)
        : await listingsApi.create(payload)

      if (files.length) {
        await listingsApi.uploadPhotos(listing.id, files)
      }

      toast.success(isEditing ? 'Listing updated' : 'Your listing is live')
      navigate(`/listings/${listing.id}`)
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save your listing'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingBlock label="Loading your listing…" />

  const preview = {
    id: 'preview',
    title: form.title || 'Your listing title',
    price: Number(form.price) || 0,
    city: form.city || 'City',
    campus_proximity: form.campus_proximity,
    rooms: Number(form.rooms) || 1,
    bathrooms: Number(form.bathrooms) || 1,
    furnished: form.furnished,
    amenities: form.amenities,
    photos: previews.length ? previews : existingPhotos,
    owner: user,
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl">
        {isEditing ? 'Edit your listing' : 'Post a listing'}
      </h1>
      <p className="mt-1.5 text-ink-soft">
        Students see the title, price and photos first — make those count.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <form onSubmit={submit} className="space-y-6" noValidate>
          <Card>
            <CardHeader title="The basics" />
            <div className="space-y-4">
              <Input
                label="Title"
                placeholder="Bright studio steps from EMSI Tanger"
                value={form.title}
                onChange={set('title')}
                error={errors.title}
                maxLength={160}
                required
              />
              <Textarea
                label="Description"
                rows={6}
                placeholder="Describe the room, the building, the neighbourhood, and who it suits."
                value={form.description}
                onChange={set('description')}
                error={errors.description}
                maxLength={5000}
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Monthly price (DH)"
                  type="number"
                  min="1"
                  placeholder="2500"
                  value={form.price}
                  onChange={set('price')}
                  error={errors.price}
                  required
                />
                <Select
                  label="City"
                  placeholder="Select a city"
                  value={form.city}
                  options={cities}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      city: event.target.value,
                      campus_proximity: '',
                    }))
                    setErrors((current) => ({ ...current, city: undefined }))
                  }}
                  error={errors.city}
                  required
                />
              </div>
              <Select
                label="Nearest campus"
                placeholder="Not campus-specific"
                value={form.campus_proximity}
                options={campusesFor(form.city)}
                onChange={set('campus_proximity')}
                disabled={!form.city}
                hint={!form.city ? 'Pick a city first' : undefined}
              />
              <Input
                label="Address"
                placeholder="Rue de Fes, Tanger"
                value={form.address}
                onChange={set('address')}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Rooms and features" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Rooms"
                value={String(form.rooms)}
                options={[1, 2, 3, 4, 5, 6].map((n) => ({
                  value: String(n),
                  label: `${n} ${n === 1 ? 'room' : 'rooms'}`,
                }))}
                onChange={set('rooms')}
              />
              <Select
                label="Bathrooms"
                value={String(form.bathrooms)}
                options={[1, 2, 3, 4].map((n) => ({
                  value: String(n),
                  label: `${n}`,
                }))}
                onChange={set('bathrooms')}
              />
            </div>

            <div className="mt-4 border-t border-tan pt-4">
              <Switch
                label="This place comes furnished"
                checked={form.furnished}
                onChange={set('furnished')}
              />
            </div>

            <fieldset className="mt-4 border-t border-tan pt-4">
              <legend className="mb-2.5 text-sm font-medium text-ink-soft">
                Amenities
              </legend>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {amenities.map((amenity) => (
                  <Checkbox
                    key={amenity}
                    label={amenity}
                    checked={form.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                  />
                ))}
              </div>
            </fieldset>
          </Card>

          <Card>
            <CardHeader
              title="Photos"
              subtitle="Up to 12 images. The first one becomes the cover."
            />

            <label
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                addFiles(event.dataTransfer.files)
              }}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-tan bg-cream/40 px-6 py-10 text-center transition-colors hover:border-ochre hover:bg-cream/70"
            >
              <ImagePlus size={28} className="text-ochre" />
              <p className="mt-2 text-sm font-medium">
                Drag photos here, or click to choose
              </p>
              <p className="text-xs text-ink-muted">JPG, PNG or WebP up to 5 MB</p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => addFiles(event.target.files)}
              />
            </label>

            {(previews.length > 0 || existingPhotos.length > 0) && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {existingPhotos.map((photo) => (
                  <div
                    key={photo}
                    className="relative h-24 overflow-hidden rounded-base border border-tan"
                  >
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
                {previews.map((url, index) => (
                  <div
                    key={url}
                    className="relative h-24 overflow-hidden rounded-base border border-tan"
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((current) =>
                          current.filter((_, position) => position !== index),
                        )
                      }
                      aria-label="Remove photo"
                      className="absolute top-1 right-1 cursor-pointer rounded-full bg-ink/70 p-1 text-shell hover:bg-danger"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="lg" icon={Upload} loading={submitting}>
              {isEditing ? 'Save changes' : 'Publish listing'}
            </Button>
          </div>
        </form>

        <div className="lg:sticky lg:top-20 lg:h-fit">
          <p className="mb-3 text-sm font-medium text-ink-soft">
            Live preview
          </p>
          <ListingCard listing={preview} />
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Camera, Phone, User } from 'lucide-react'

import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card, { CardHeader } from '../components/ui/Card'
import Input, { Select, Textarea } from '../components/ui/Input'
import { ROLES } from '../core/config/constants'
import { errorMessage } from '../core/api/client'
import { formatDate } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import { useListingMeta } from '../hooks/useListingMeta'
import { usersApi } from '../core/api/endpoints'
import { useToast } from '../components/ui/Toast'

export default function ProfilePage() {
  const { user, updateProfile, refreshUser } = useAuth()
  const { cities } = useListingMeta()
  const toast = useToast()

  const [form, setForm] = useState({
    name: user.name ?? '',
    bio: user.bio ?? '',
    phone: user.phone ?? '',
    city: user.city ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const set = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await updateProfile({
        name: form.name,
        bio: form.bio || undefined,
        phone: form.phone || undefined,
        city: form.city || undefined,
      })
      toast.success('Profile updated')
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save your profile'))
    } finally {
      setSaving(false)
    }
  }

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      await usersApi.uploadAvatar(file)
      await refreshUser()
      toast.success('Photo updated')
    } catch (error) {
      toast.error(errorMessage(error, 'Could not upload that image'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl">Your profile</h1>
      <p className="mt-1.5 text-ink-soft">
        This is what other people on RoomieMA see.
      </p>

      <Card className="mt-6 flex flex-wrap items-center gap-5">
        <div className="relative">
          <Avatar user={user} size="xl" />
          <label className="absolute -right-1 -bottom-1 cursor-pointer rounded-full border-2 border-shell bg-terracotta p-2 text-shell transition-colors hover:bg-terracotta-dark">
            <Camera size={14} />
            <span className="sr-only">Change profile photo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={uploadAvatar}
            />
          </label>
        </div>

        <div>
          <h2 className="text-2xl">{user.name}</h2>
          <p className="text-sm text-ink-soft">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={user.role === ROLES.LANDLORD ? 'primary' : 'info'}>
              {user.role === ROLES.LANDLORD ? 'Property owner' : 'Student'}
            </Badge>
            <span className="text-xs text-ink-muted">
              Member since {formatDate(user.created_at, { day: undefined })}
            </span>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader
          title="Details"
          subtitle="Owners and students see your name, bio and city."
        />
        <form onSubmit={save} className="space-y-4">
          <Input
            label="Full name"
            icon={User}
            value={form.name}
            onChange={set('name')}
            required
          />
          <Textarea
            label="Bio"
            rows={4}
            maxLength={2000}
            placeholder={
              user.role === ROLES.LANDLORD
                ? 'Tell students about your building and how you like to work with tenants.'
                : 'Tell owners what you study, when you need the room, and a bit about yourself.'
            }
            value={form.bio}
            onChange={set('bio')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Phone"
              icon={Phone}
              placeholder="0612345678"
              value={form.phone}
              onChange={set('phone')}
              hint="Moroccan number, stored as +212…"
            />
            <Select
              label="City"
              placeholder="Select a city"
              value={form.city}
              options={cities}
              onChange={set('city')}
            />
          </div>

          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </form>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Home, Lock, Mail, Phone, User } from 'lucide-react'

import Button from '../components/ui/Button'
import Input, { Checkbox, Select } from '../components/ui/Input'
import { CrescentAccent } from '../components/ui/Feedback'
import { ROLES } from '../core/config/constants'
import { errorMessage } from '../core/api/client'
import { useAuth } from '../context/AuthContext'
import { useListingMeta } from '../hooks/useListingMeta'
import { useToast } from '../components/ui/Toast'

const ROLE_CARDS = [
  {
    role: ROLES.STUDENT,
    icon: GraduationCap,
    title: "I'm a student",
    body: 'Search rooms, apply, and message owners.',
  },
  {
    role: ROLES.LANDLORD,
    icon: Home,
    title: 'I own a place',
    body: 'Post listings and pick your tenants.',
  },
]

export default function RegisterPage() {
  const { signUp } = useAuth()
  const { cities } = useListingMeta()
  const toast = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ROLES.STUDENT,
    phone: '',
    city: '',
  })
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: validateField(field, value) }))
  }

  function validateField(field, value) {
    switch (field) {
      case 'name':
        return value.trim().length < 2 ? 'Enter your full name' : undefined
      case 'email':
        return /^\S+@\S+\.\S+$/.test(value) ? undefined : 'Enter a valid email'
      case 'password':
        if (value.length < 8) return 'At least 8 characters'
        if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
          return 'Mix letters and numbers'
        }
        return undefined
      case 'confirmPassword':
        return value === form.password ? undefined : 'Passwords do not match'
      case 'phone':
        if (!value) return undefined
        return /^(\+212|0)[5-7]\d{8}$/.test(value.replace(/\s/g, ''))
          ? undefined
          : 'Use a Moroccan number, e.g. 0612345678'
      default:
        return undefined
    }
  }

  const validate = () => {
    const next = {}
    ;['name', 'email', 'password', 'confirmPassword', 'phone'].forEach((field) => {
      const message = validateField(field, form[field])
      if (message) next[field] = message
    })
    if (!form.password) next.password = 'Password is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    if (!agreed) {
      toast.error('Please accept the terms to continue')
      return
    }

    setSubmitting(true)
    try {
      const { confirmPassword: _confirmPassword, phone, city, ...rest } = form
      await signUp({
        ...rest,
        phone: phone || undefined,
        city: city || undefined,
      })
      toast.success('Account created — welcome to RoomieMA')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(errorMessage(error, 'Could not create your account'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative mx-auto max-w-lg px-4 py-14 sm:px-6">
      <CrescentAccent className="pointer-events-none absolute -top-4 -left-6 h-32 w-32" />

      <div className="relative rounded-xl border border-tan bg-shell p-8 shadow-[var(--shadow-card)]">
        <h1 className="text-3xl">Create your account</h1>
        <p className="mt-2 text-sm text-ink-soft">
          It takes a minute, and it&apos;s free.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink-soft">
              I am joining as
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {ROLE_CARDS.map(({ role, icon: Icon, title, body }) => {
                const active = form.role === role
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, role }))}
                    aria-pressed={active}
                    className={[
                      'cursor-pointer rounded-lg border p-4 text-left transition-all',
                      active
                        ? 'border-terracotta bg-terracotta/8 shadow-sm'
                        : 'border-tan bg-cream/40 hover:border-ochre',
                    ].join(' ')}
                  >
                    <Icon
                      size={20}
                      className={active ? 'text-terracotta' : 'text-ochre'}
                    />
                    <p className="mt-2 text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{body}</p>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <Input
            label="Full name"
            icon={User}
            autoComplete="name"
            placeholder="Yasmine Alaoui"
            value={form.name}
            onChange={update('name')}
            error={errors.name}
            required
          />
          <Input
            label="Email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="you@example.ma"
            value={form.email}
            onChange={update('email')}
            error={errors.email}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Password"
              type="password"
              icon={Lock}
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.password}
              onChange={update('password')}
              error={errors.password}
              hint={!errors.password ? '8+ characters, letters and numbers' : undefined}
              required
            />
            <Input
              label="Confirm password"
              type="password"
              icon={Lock}
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              error={errors.confirmPassword}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Phone (optional)"
              icon={Phone}
              placeholder="0612345678"
              value={form.phone}
              onChange={update('phone')}
              error={errors.phone}
            />
            <Select
              label="City (optional)"
              placeholder="Select a city"
              value={form.city}
              options={cities}
              onChange={update('city')}
            />
          </div>

          <Checkbox
            label="I agree to the terms of service and privacy policy"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
          />

          <Button type="submit" fullWidth size="lg" loading={submitting}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-terracotta no-underline hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

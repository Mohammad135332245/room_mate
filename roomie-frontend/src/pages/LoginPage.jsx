import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'

import Button from '../components/ui/Button'
import Input, { Checkbox } from '../components/ui/Input'
import { CrescentAccent } from '../components/ui/Feedback'
import { errorMessage } from '../core/api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'

export default function LoginPage() {
  const { signIn } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const validate = () => {
    const next = {}
    if (!form.email) next.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email'
    if (!form.password) next.password = 'Password is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const user = await signIn(form)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`)
      navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true })
    } catch (error) {
      toast.error(errorMessage(error, 'Could not sign you in'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative mx-auto flex max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <CrescentAccent className="pointer-events-none absolute -top-4 -right-4 h-32 w-32" />

      <div className="relative rounded-xl border border-tan bg-shell p-8 shadow-[var(--shadow-card)]">
        <h1 className="text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Sign in to track your applications and messages.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
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
          <Input
            label="Password"
            type="password"
            icon={Lock}
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={update('password')}
            error={errors.password}
            required
          />

          <div className="flex items-center justify-between">
            <Checkbox label="Remember me" defaultChecked />
            <span className="text-sm text-ink-muted">Forgot password?</span>
          </div>

          <Button type="submit" fullWidth size="lg" loading={submitting}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-terracotta no-underline hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

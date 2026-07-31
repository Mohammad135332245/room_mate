import { useNavigate } from 'react-router-dom'

import Button from '../components/ui/Button'
import { CrescentAccent } from '../components/ui/Feedback'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="relative mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <CrescentAccent className="pointer-events-none absolute top-8 right-4 h-40 w-40" />

      <p className="font-display text-6xl font-bold text-terracotta">404</p>
      <h1 className="mt-4 text-3xl">This page moved out</h1>
      <p className="mt-3 text-ink-soft">
        The page you were looking for isn&apos;t here. Let&apos;s get you back to
        the rooms.
      </p>

      <div className="mt-8 flex justify-center gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button onClick={() => navigate('/listings')}>Browse rooms</Button>
      </div>
    </div>
  )
}

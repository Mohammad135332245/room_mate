import { Link } from 'react-router-dom'

import Logo from './Logo'
import { CITIES } from '../../core/config/constants'

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-tan bg-shell">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="zellige absolute inset-0" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-ink-soft">
            Student housing across Morocco. Find a room near your campus, talk
            to the owner directly, and book a viewing — all in one place.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold tracking-wide text-ink uppercase">
            Explore
          </h4>
          <ul className="space-y-2 text-sm">
            <FooterLink to="/listings">Browse rooms</FooterLink>
            <FooterLink to="/register">Create an account</FooterLink>
            <FooterLink to="/login">Sign in</FooterLink>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold tracking-wide text-ink uppercase">
            Cities
          </h4>
          <ul className="space-y-2 text-sm">
            {CITIES.slice(0, 5).map((city) => (
              <FooterLink key={city} to={`/listings?city=${city}`}>
                Rooms in {city}
              </FooterLink>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative border-t border-tan px-4 py-5 text-center text-sm text-ink-muted sm:px-6">
        © {new Date().getFullYear()} RoomieMA — made for Moroccan students.
      </div>
    </footer>
  )
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link
        to={to}
        className="text-ink-soft no-underline transition-colors hover:text-terracotta"
      >
        {children}
      </Link>
    </li>
  )
}

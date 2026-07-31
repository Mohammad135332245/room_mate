import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  Search,
  User,
  X,
} from 'lucide-react'

import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import Logo from './Logo'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'

function navClasses({ isActive }) {
  return [
    'rounded-base px-3 py-2 text-sm font-medium no-underline transition-colors',
    isActive
      ? 'bg-terracotta/12 text-terracotta-dark'
      : 'text-ink-soft hover:bg-tan-soft hover:text-ink',
  ].join(' ')
}

export default function Navbar() {
  const { user, isAuthenticated, isLandlord, signOut } = useAuth()
  const { unread } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef(null)

  // Any navigation closes whatever was open.
  useEffect(() => {
    setMenuOpen(false)
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onClickOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-tan bg-shell/95 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="zellige absolute inset-0" />
      </div>

      <nav className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/listings" className={navClasses}>
            Browse rooms
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/dashboard" className={navClasses}>
                Dashboard
              </NavLink>
              <NavLink to="/messages" className={navClasses}>
                <span className="inline-flex items-center gap-1.5">
                  Messages
                  {unread > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1.5 text-[11px] font-semibold text-shell">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </span>
              </NavLink>
            </>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isLandlord && (
            <Button
              size="sm"
              icon={PlusCircle}
              onClick={() => navigate('/post-listing')}
            >
              Post a listing
            </Button>
          )}

          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex cursor-pointer items-center gap-2 rounded-full border border-tan bg-shell py-1 pr-2.5 pl-1 transition-colors hover:border-ochre"
              >
                <Avatar user={user} size="sm" />
                <span className="max-w-24 truncate text-sm text-ink-soft">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown size={15} className="text-ink-muted" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="animate-fade-in absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-tan bg-shell shadow-[var(--shadow-lift)]"
                >
                  <div className="border-b border-tan px-4 py-3">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-ink-muted">{user.email}</p>
                  </div>
                  <MenuLink to="/dashboard" icon={LayoutDashboard}>
                    Dashboard
                  </MenuLink>
                  <MenuLink to="/messages" icon={MessageSquare}>
                    Messages
                  </MenuLink>
                  <MenuLink to="/profile" icon={User}>
                    Profile
                  </MenuLink>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full cursor-pointer items-center gap-2.5 border-t border-tan px-4 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger/8"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-base px-3 py-2 text-sm font-medium text-ink-soft no-underline transition-colors hover:text-ink"
              >
                Sign in
              </Link>
              <Button size="sm" onClick={() => navigate('/register')}>
                Get started
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          className="cursor-pointer rounded-base p-2 text-ink-soft transition-colors hover:bg-tan-soft md:hidden"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="animate-fade-in relative border-t border-tan bg-shell px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <MobileLink to="/listings" icon={Search}>
              Browse rooms
            </MobileLink>
            {isAuthenticated ? (
              <>
                <MobileLink to="/dashboard" icon={LayoutDashboard}>
                  Dashboard
                </MobileLink>
                <MobileLink to="/messages" icon={MessageSquare}>
                  Messages {unread > 0 && `(${unread})`}
                </MobileLink>
                <MobileLink to="/profile" icon={User}>
                  Profile
                </MobileLink>
                {isLandlord && (
                  <MobileLink to="/post-listing" icon={PlusCircle}>
                    Post a listing
                  </MobileLink>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="mt-1 flex cursor-pointer items-center gap-2.5 rounded-base px-3 py-2.5 text-left text-sm text-danger hover:bg-danger/8"
                >
                  <LogOut size={17} />
                  Sign out
                </button>
              </>
            ) : (
              <div className="mt-2 flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => navigate('/login')}
                >
                  Sign in
                </Button>
                <Button fullWidth onClick={() => navigate('/register')}>
                  Get started
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

function MenuLink({ to, icon: Icon, children }) {
  return (
    <Link
      to={to}
      role="menuitem"
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft no-underline transition-colors hover:bg-tan-soft hover:text-ink"
    >
      <Icon size={16} />
      {children}
    </Link>
  )
}

function MobileLink({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex items-center gap-2.5 rounded-base px-3 py-2.5 text-sm no-underline',
          isActive
            ? 'bg-terracotta/12 text-terracotta-dark'
            : 'text-ink-soft hover:bg-tan-soft',
        ].join(' ')
      }
    >
      <Icon size={17} />
      {children}
    </NavLink>
  )
}

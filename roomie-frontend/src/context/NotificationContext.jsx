import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { chatApi } from '../core/api/endpoints'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

const POLL_INTERVAL = 30_000

/** Tracks the unread-message badge shown in the navbar. */
export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setUnread(0)
      return
    }
    try {
      const { unread: count } = await chatApi.unreadCount()
      setUnread(count)
    } catch {
      // A failed poll is not worth surfacing to the user.
    }
  }, [isAuthenticated])

  useEffect(() => {
    refresh()
    if (!isAuthenticated) return
    const timer = setInterval(refresh, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [refresh, isAuthenticated])

  const value = useMemo(
    () => ({
      unread,
      refresh,
      clearFor: () => setUnread(0),
      bump: () => setUnread((count) => count + 1),
    }),
    [unread, refresh],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used inside a NotificationProvider')
  }
  return context
}

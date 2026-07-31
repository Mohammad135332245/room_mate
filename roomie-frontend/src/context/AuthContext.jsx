import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { authApi, usersApi } from '../core/api/endpoints'
import { setSessionExpiredHandler } from '../core/api/client'
import { ROLES } from '../core/config/constants'
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  saveTokens,
  saveUser,
} from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Hydrate from localStorage so a refresh doesn't flash the signed-out UI.
  const [user, setUser] = useState(() => getStoredUser())
  const [loading, setLoading] = useState(() => Boolean(getAccessToken()))

  const signOut = useCallback(async () => {
    try {
      if (getAccessToken()) await authApi.logout()
    } catch {
      // Logout is best-effort; the token is dropped either way.
    }
    clearSession()
    setUser(null)
  }, [])

  // Revalidate the stored session against the API on mount.
  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false)
      return
    }
    let cancelled = false

    authApi
      .me()
      .then((fresh) => {
        if (cancelled) return
        setUser(fresh)
        saveUser(fresh)
      })
      .catch(() => {
        if (!cancelled) {
          clearSession()
          setUser(null)
        }
      })
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [])

  // A failed token refresh means the session is unrecoverable.
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null))
  }, [])

  const applySession = useCallback((data) => {
    saveTokens(data)
    saveUser(data.user)
    setUser(data.user)
    return data.user
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isStudent: user?.role === ROLES.STUDENT,
      isLandlord: user?.role === ROLES.LANDLORD,
      signIn: async (credentials) => applySession(await authApi.login(credentials)),
      signUp: async (payload) => applySession(await authApi.register(payload)),
      signOut,
      updateProfile: async (payload) => {
        const updated = await usersApi.updateMe(payload)
        setUser(updated)
        saveUser(updated)
        return updated
      },
      refreshUser: async () => {
        const fresh = await usersApi.me()
        setUser(fresh)
        saveUser(fresh)
        return fresh
      },
    }),
    [user, loading, applySession, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}

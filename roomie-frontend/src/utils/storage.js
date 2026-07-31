import { STORAGE_KEYS } from '../core/config/constants'

/** localStorage wrapper that never throws (private mode, quota, SSR). */
const safe = {
  get(key) {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      /* ignore */
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  },
}

export const getAccessToken = () => safe.get(STORAGE_KEYS.accessToken)
export const getRefreshToken = () => safe.get(STORAGE_KEYS.refreshToken)

export function saveTokens({ access_token, refresh_token }) {
  if (access_token) safe.set(STORAGE_KEYS.accessToken, access_token)
  if (refresh_token) safe.set(STORAGE_KEYS.refreshToken, refresh_token)
}

export function getStoredUser() {
  const raw = safe.get(STORAGE_KEYS.user)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveUser(user) {
  safe.set(STORAGE_KEYS.user, JSON.stringify(user))
}

export function clearSession() {
  Object.values(STORAGE_KEYS).forEach(safe.remove)
}

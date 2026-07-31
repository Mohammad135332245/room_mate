import axios from 'axios'

import { API_BASE_URL } from '../config/constants'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from '../../utils/storage'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** Called when refreshing fails — AuthContext wires this to a logout. */
let onSessionExpired = () => {}
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler
}

// While a refresh is in flight, queue every other 401 instead of firing
// a refresh per request.
let refreshing = null

async function refreshAccessToken() {
  const refresh_token = getRefreshToken()
  if (!refresh_token) throw new Error('No refresh token')

  const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
    refresh_token,
  })
  saveTokens(data)
  return data.access_token
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error

    if (response?.status === 401 && !config?._retried && getRefreshToken()) {
      config._retried = true
      try {
        refreshing = refreshing ?? refreshAccessToken()
        const token = await refreshing
        refreshing = null
        config.headers.Authorization = `Bearer ${token}`
        return api(config)
      } catch {
        refreshing = null
        clearSession()
        onSessionExpired()
      }
    }

    return Promise.reject(error)
  },
)

/** Turn an axios error into a single human-readable string. */
export function errorMessage(error, fallback = 'Something went wrong') {
  const detail = error?.response?.data?.detail
  const fieldErrors = error?.response?.data?.errors

  if (Array.isArray(fieldErrors) && fieldErrors.length) {
    return fieldErrors.map((e) => `${e.field}: ${e.message}`).join(', ')
  }
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  if (error?.message === 'Network Error') {
    return 'Cannot reach the server. Is the API running?'
  }
  return fallback
}

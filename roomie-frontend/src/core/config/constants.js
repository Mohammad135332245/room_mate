export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws'

export const STORAGE_KEYS = {
  accessToken: 'roomiema.access_token',
  refreshToken: 'roomiema.refresh_token',
  user: 'roomiema.user',
}

export const ROLES = {
  STUDENT: 'STUDENT',
  LANDLORD: 'LANDLORD',
}

export const APPLICATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  MEETING_SCHEDULED: 'MEETING_SCHEDULED',
  COMPLETED: 'COMPLETED',
}

export const STATUS_LABELS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  MEETING_SCHEDULED: 'Viewing booked',
  COMPLETED: 'Completed',
}

/** Badge tone per application status. */
export const STATUS_TONES = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  DECLINED: 'danger',
  MEETING_SCHEDULED: 'info',
  COMPLETED: 'neutral',
}

export const MEETING_TYPES = {
  VIRTUAL: 'VIRTUAL',
  IN_PERSON: 'IN_PERSON',
}

/** Fallback list — the live one comes from GET /listings/meta. */
export const CITIES = [
  'Tanger',
  'Casablanca',
  'Rabat',
  'Fes',
  'Marrakech',
  'Agadir',
  'Meknes',
  'Oujda',
  'Tetouan',
  'Kenitra',
]

export const DEFAULT_CITY = 'Tanger'

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
]

export const PAGE_SIZE = 20

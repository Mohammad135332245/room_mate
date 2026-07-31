import { api } from './client'

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
}

export const usersApi = {
  me: () => api.get('/users/me').then((r) => r.data),
  updateMe: (payload) => api.put('/users/me', payload).then((r) => r.data),
  stats: () => api.get('/users/me/stats').then((r) => r.data),
  profile: (userId) => api.get(`/users/${userId}`).then((r) => r.data),
  reviews: (userId) => api.get(`/users/${userId}/reviews`).then((r) => r.data),
  leaveReview: (payload) => api.post('/users/reviews', payload).then((r) => r.data),
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post('/users/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}

export const listingsApi = {
  browse: (params) => api.get('/listings', { params }).then((r) => r.data),
  meta: () => api.get('/listings/meta').then((r) => r.data),
  featured: (limit = 4) =>
    api.get('/listings/featured', { params: { limit } }).then((r) => r.data),
  mine: () => api.get('/listings/mine').then((r) => r.data),
  saved: () => api.get('/listings/saved').then((r) => r.data),
  detail: (id) => api.get(`/listings/${id}`).then((r) => r.data),
  related: (id, limit = 3) =>
    api.get(`/listings/${id}/related`, { params: { limit } }).then((r) => r.data),
  create: (payload) => api.post('/listings', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/listings/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/listings/${id}`).then((r) => r.data),
  applications: (id) =>
    api.get(`/listings/${id}/applications`).then((r) => r.data),
  save: (id) => api.post(`/listings/${id}/save`).then((r) => r.data),
  unsave: (id) => api.delete(`/listings/${id}/save`).then((r) => r.data),
  uploadPhotos: (id, files) => {
    const form = new FormData()
    files.forEach((file) => form.append('files', file))
    return api
      .post(`/listings/${id}/photos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}

export const applicationsApi = {
  submit: (payload) => api.post('/applications', payload).then((r) => r.data),
  mine: () => api.get('/applications/my').then((r) => r.data),
  received: () => api.get('/applications/received').then((r) => r.data),
  conversations: () => api.get('/applications/conversations').then((r) => r.data),
  detail: (id) => api.get(`/applications/${id}`).then((r) => r.data),
  setStatus: (id, status) =>
    api.put(`/applications/${id}/status`, { status }).then((r) => r.data),
  withdraw: (id) => api.delete(`/applications/${id}`).then((r) => r.data),
}

export const meetingsApi = {
  list: (params) => api.get('/meetings', { params }).then((r) => r.data),
  schedule: (payload) => api.post('/meetings', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/meetings/${id}`, payload).then((r) => r.data),
  cancel: (id) => api.delete(`/meetings/${id}`).then((r) => r.data),
}

export const chatApi = {
  history: (applicationId, params) =>
    api.get(`/chats/${applicationId}/history`, { params }).then((r) => r.data),
  send: (applicationId, text) =>
    api.post(`/chats/${applicationId}/messages`, { text }).then((r) => r.data),
  markRead: (applicationId) =>
    api.post(`/chats/${applicationId}/read`).then((r) => r.data),
  unreadCount: () => api.get('/chats/unread-count').then((r) => r.data),
}

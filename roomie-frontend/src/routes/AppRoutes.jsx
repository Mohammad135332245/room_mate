import { Route, Routes } from 'react-router-dom'

import AppLayout from '../components/layout/AppLayout'
import ProtectedRoute, { GuestRoute } from './ProtectedRoute'
import { ROLES } from '../core/config/constants'

import BrowseListingsPage from '../pages/BrowseListingsPage'
import DashboardPage from '../pages/DashboardPage'
import HomePage from '../pages/HomePage'
import ListingDetailsPage from '../pages/ListingDetailsPage'
import LoginPage from '../pages/LoginPage'
import MessagesPage from '../pages/MessagesPage'
import NotFoundPage from '../pages/NotFoundPage'
import PostListingPage from '../pages/PostListingPage'
import ProfilePage from '../pages/ProfilePage'
import PublicProfilePage from '../pages/PublicProfilePage'
import RegisterPage from '../pages/RegisterPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/listings" element={<BrowseListingsPage />} />
        <Route path="/listings/:id" element={<ListingDetailsPage />} />
        <Route path="/users/:id" element={<PublicProfilePage />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:applicationId" element={<MessagesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route element={<ProtectedRoute role={ROLES.LANDLORD} />}>
          <Route path="/post-listing" element={<PostListingPage />} />
          <Route path="/listings/:id/edit" element={<PostListingPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

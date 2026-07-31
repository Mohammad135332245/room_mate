import { Outlet } from 'react-router-dom'

import Footer from './Footer'
import Navbar from './Navbar'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

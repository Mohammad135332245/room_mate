import { BrowserRouter } from 'react-router-dom'

import AppRoutes from './routes/AppRoutes'
import ScrollToTop from './components/layout/ScrollToTop'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { ToastProvider } from './components/ui/Toast'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <ScrollToTop />
            <AppRoutes />
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

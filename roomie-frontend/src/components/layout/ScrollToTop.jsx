import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Resets scroll position on navigation, the way a page load would. */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

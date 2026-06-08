import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function useVisitTracker() {
  const location = useLocation()

  useEffect(() => {
    // Record visit on route change
    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ route: location.pathname + location.search }),
    }).catch(() => {}) // silent fail
  }, [location.pathname, location.search])
}

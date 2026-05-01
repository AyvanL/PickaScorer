import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getSession()
      setIsAuthenticated(!!data.session)
    }

    void checkAuth()

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  // Show nothing while checking auth
  if (isAuthenticated === null) {
    return <div />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

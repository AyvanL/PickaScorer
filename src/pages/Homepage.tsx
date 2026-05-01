import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import '../dashboard.css'

export default function Homepage() {
  const navigate = useNavigate()
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUserEmail() {
      const { data } = await supabase.auth.getUser()
      setUserEmail(data.user?.email || '')
      setLoading(false)
    }
    void getUserEmail()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="dashboard-shell">
      {/* Header with logout */}
      <div className="dashboard-header">
        <div className="brand-row brand-header">
          <div className="logo-bubble">P</div>
          <div className="brand-text">PickaScorer</div>
        </div>
        <div className="header-right">
          {!loading && userEmail && (
            <span className="user-email">{userEmail}</span>
          )}
          <button className="logout-btn" onClick={handleLogout} title="Sign out">
            ↗ Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="dashboard-content">
        <h1 className="dashboard-title">Match Control</h1>
        <p className="dashboard-sub">Choose how you want to manage your match</p>

        <div className="button-grid-full">
          <button onClick={() => navigate('/display')} className="dashboard-btn display-btn">
            <div className="btn-icon">📊</div>
            <div className="btn-title">Display</div>
            <div className="btn-desc">View full-screen scoreboard</div>
          </button>

          <button onClick={() => navigate('/remote')} className="dashboard-btn remote-btn">
            <div className="btn-icon">🎮</div>
            <div className="btn-title">Remote</div>
            <div className="btn-desc">Control match scoring</div>
          </button>
        </div>
      </div>
    </div>
  )
}

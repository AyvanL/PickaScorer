import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import '../dashboard.css'
import pickleBG from '../assets/pickleBG.png'

export default function Homepage() {
  const navigate = useNavigate()
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUserEmailAndEnsureMatchesRow() {
      try {
        const { data } = await supabase.auth.getUser()
        const email = data.user?.email || ''
        
        if (email) {
          setUserEmail(email)
          console.log('Checking/creating matches for email:', email)
          
          // Get all rows for this user
          const { data: allMatches, error: queryError } = await supabase
            .from('matches')
            .select('id')
            .eq('user_id', email)
          
          if (queryError) {
            console.error('Error querying matches:', queryError)
          }
          
          // If multiple rows exist, delete extras and keep one
          if (allMatches && allMatches.length > 1) {
            console.log('Found', allMatches.length, 'rows, cleaning up duplicates...')
            const idsToDelete = allMatches.slice(1).map(m => m.id)
            
            const { error: deleteError } = await supabase
              .from('matches')
              .delete()
              .in('id', idsToDelete)
            
            if (deleteError) {
              console.error('Error deleting duplicate rows:', deleteError)
            } else {
              console.log('Deleted', idsToDelete.length, 'duplicate rows')
            }
          }
          
          // If no rows exist, create one
          if (!allMatches || allMatches.length === 0) {
            console.log('Creating new matches row for:', email)
            const { data: insertData, error: insertError } = await supabase
              .from('matches')
              .insert([
                {
                  user_id: email,
                  team1_score: 0,
                  team2_score: 0,
                  server_number: 1,
                  serving_team: 1,
                },
              ])
              .select()
            
            if (insertError) {
              console.error('Error creating matches row:', insertError.message, insertError.details)
            } else {
              console.log('Matches row created successfully:', insertData)
            }
          } else {
            console.log('Matches row already exists for user')
          }
        }
      } catch (error) {
        console.error('Error in getUserEmailAndEnsureMatchesRow:', error)
      } finally {
        setLoading(false)
      }
    }
    void getUserEmailAndEnsureMatchesRow()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div
      className="dashboard-shell"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(10,10,10,0.98), rgba(15,15,15,0.96)), url(${pickleBG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Header with logout */}
      <div className="dashboard-header">
        <div className="brand-row brand-header">
          <div className="logo-bubble">P</div>
          <div className="brand-text">PickaScorer</div>
        </div>
        <div className="header-right">
          
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
            <div className="btn-icon">🖥️</div>
            <div className="btn-title">Display</div>
            <div className="btn-desc">View full-screen scoreboard</div>
          </button>

          <button onClick={() => navigate('/remote')} className="dashboard-btn remote-btn">
            <div className="btn-icon">🕹️</div>
            <div className="btn-title">Remote</div>
            <div className="btn-desc">Control match scoring</div>
          </button>
        </div>
        {!loading && userEmail && (
            <span className="user-email">{userEmail}</span>
          )}
      </div>
    </div>
  )
}

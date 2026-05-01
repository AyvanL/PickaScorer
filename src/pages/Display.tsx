import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import '../display.css'

export default function Display() {
  const [team1Score, setTeam1Score] = useState(0)
  const [team2Score, setTeam2Score] = useState(0)
  const [serverNumber, setServerNumber] = useState(1)
  const [servingTeam, setServingTeam] = useState<1 | 2>(1)
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadUserAndScores() {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user?.email) {
        console.error('Failed to get user email')
        setLoading(false)
        return
      }

      const email = userData.user.email
      setUserEmail(email)

      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('team1_score, team2_score, server_number, serving_team')
        .eq('user_id', email)
        .single()

      if (!matchError && matchData) {
        setTeam1Score(matchData.team1_score)
        setTeam2Score(matchData.team2_score)
        setServerNumber(matchData.server_number)
        setServingTeam(matchData.serving_team)
      }

      setLoading(false)
    }

    void loadUserAndScores()

    const subscription = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          if (payload.new.user_id === userEmail) {
            setTeam1Score(payload.new.team1_score)
            setTeam2Score(payload.new.team2_score)
            setServerNumber(payload.new.server_number)
            setServingTeam(payload.new.serving_team)
          }
        }
      )
      .subscribe()

    return () => {
      void subscription.unsubscribe()
    }
  }, [userEmail])

  return (
    <div className="display-wrapper">
      <button className="back-button" onClick={() => navigate('/dashboard')} title="Back to home">
        ← Back
      </button>

      <div className="status-indicator"></div>

      {/* Team 1 Score */}
      <div className="score-section team1">
        <div className="large-score">{String(team1Score).padStart(2, '0')}</div>
      </div>

      {/* Center Section */}
      <div className="center-section">
        <div className="server-box">
          <div className="server-label">SERVER NUMBER</div>
          <div className="server-number">{serverNumber}</div>
        </div>
        
        <div className="game-info">
          <div className="game-label">SERVING</div>
          <div className="match-status" style={{opacity: 1}}>
            TEAM {servingTeam}
          </div>
        </div>
      </div>

      {/* Team 2 Score */}
      <div className="score-section team2">
        <div className="large-score">{String(team2Score).padStart(2, '0')}</div>
      </div>
    </div>
  )
}

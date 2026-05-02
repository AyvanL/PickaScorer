import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import '../display.css'
import pickleBG from '../assets/pickleBG.png'

type FinishMatchEvent = {
  winner: 1 | 2 | 0
  team1_score: number
  team2_score: number
}

export default function Display() {
  const [team1Score, setTeam1Score] = useState(0)
  const [team2Score, setTeam2Score] = useState(0)
  const [serverNumber, setServerNumber] = useState(1)
  const [servingTeam, setServingTeam] = useState<1 | 2>(1)
  const [userEmail, setUserEmail] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [winner, setWinner] = useState<1 | 2 | 0 | null>(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [modalFinalScore, setModalFinalScore] = useState<{ team1: number; team2: number } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadUserAndScores() {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user?.email) {
        console.error('Failed to get user email')
        return
      }

      const email = userData.user.email
      setUserEmail(email)

      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('team1_score, team2_score, server_number, serving_team, winner')
        .eq('user_id', email)
        .single()

      if (!matchError && matchData) {
        setTeam1Score(matchData.team1_score)
        setTeam2Score(matchData.team2_score)
        setServerNumber(matchData.server_number)
        setServingTeam(matchData.serving_team)
        setWinner(matchData.winner)
      }
    }

    void loadUserAndScores()
  }, [])

  useEffect(() => {
    if (!userEmail) {
      return
    }

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
            setWinner(payload.new.winner)
          }
        }
      )
      .subscribe()

    const finishChannel = supabase
      .channel(`match-events-${userEmail}`)
      .on('broadcast', { event: 'match_finished' }, (message) => {
        const finishEvent = message.payload as FinishMatchEvent

        setWinner(finishEvent.winner)
        setModalFinalScore({
          team1: finishEvent.team1_score,
          team2: finishEvent.team2_score,
        })

        if (finishEvent.winner === 1 || finishEvent.winner === 2) {
          setShowWinnerModal(true)
        }
      })
      .subscribe()

    return () => {
      void subscription.unsubscribe()
      void finishChannel.unsubscribe()
    }
  }, [userEmail])

  const handleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  return (
    <div
      className="display-wrapper"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(10,10,10,0.98), rgba(15,15,15,0.96)), url(${pickleBG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <button className="fullscreen-button" onClick={handleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
        {isFullscreen ? '⛶' : '⛶'}
      </button>

      <button className="back-button" onClick={() => navigate('/dashboard')} title="Back to home">
        ← Back
      </button>

      <div className="status-indicator"></div>

      {/* Team 1 Score */}
      <div className={`score-section team1 ${servingTeam === 1 ? 'is-serving' : ''}`}>
        <div className="score-box">
          <div className="team-label">TEAM 1</div>
          <div className="large-score">{String(team1Score).padStart(2, '0')}</div>
        </div>
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
      <div className={`score-section team2 ${servingTeam === 2 ? 'is-serving' : ''}`}>
        <div className="score-box">
          <div className="team-label">TEAM 2</div>
          <div className="large-score">{String(team2Score).padStart(2, '0')}</div>
        </div>
      </div>

      {/* Winner Modal */}
      {showWinnerModal && winner !== null && winner !== 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'linear-gradient(180deg, rgba(6,6,6,0.98), rgba(10,10,10,0.96))',
            border: '2px solid #99CC33',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            maxWidth: '500px',
            boxShadow: '0 20px 60px rgba(153,204,51,0.3)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎉</div>
            <h2 style={{ color: '#99CC33', fontSize: '32px', marginBottom: '12px', fontWeight: '700' }}>TEAM {winner} WINS!</h2>
            <p style={{ color: '#a6a6a6', fontSize: '18px', marginBottom: '30px' }}>
              Final Score: Team 1: {String(modalFinalScore?.team1 ?? team1Score).padStart(2, '0')} - Team 2: {String(modalFinalScore?.team2 ?? team2Score).padStart(2, '0')}
            </p>
            <button
              onClick={() => {
                setShowWinnerModal(false)
                setModalFinalScore(null)
              }}
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(90deg, #99CC33, #8cc41e)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '16px',
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

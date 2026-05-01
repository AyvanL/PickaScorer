import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../display.css'

export default function Display() {
  const [team1Score, setTeam1Score] = useState(11)
  const [team2Score, setTeam2Score] = useState(9)
  const [serverNumber, setServerNumber] = useState(2)
  const [isMatchPoint, setIsMatchPoint] = useState(true)
  const navigate = useNavigate()

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
          <div className="game-label">GAME</div>
          <div className="match-status" style={{opacity: isMatchPoint ? 1 : 0.5}}>
            MATCH POINT
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

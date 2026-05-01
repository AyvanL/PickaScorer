import { useNavigate } from 'react-router-dom'
import '../dashboard.css'

export default function Homepage() {
  const navigate = useNavigate()

  return (
    <div className="dashboard-shell">
      <div className="brand-row brand-header">
        <div className="logo-bubble">P</div>
        <div className="brand-text">PickaScorer</div>
      </div>

      <div className="button-grid-full">
        <button onClick={() => navigate('/display')} className="dashboard-btn display-btn">
          <div className="btn-icon">📊</div>
          <div className="btn-title">Display</div>
          <div className="btn-desc">View scoring display</div>
        </button>

        <button onClick={() => navigate('/remote')} className="dashboard-btn remote-btn">
          <div className="btn-icon">🎮</div>
          <div className="btn-title">Remote</div>
          <div className="btn-desc">Control scoring remotely</div>
        </button>
      </div>
    </div>
  )
}

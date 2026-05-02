import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import '../remote.css'

type MatchState = {
  team1_score: number
  team2_score: number
  server_number: number
  serving_team: 1 | 2
}

const initialState: MatchState = {
  team1_score: 0,
  team2_score: 0
  ,
  server_number: 1,
  serving_team: 1,
}

const resetState: MatchState = {
  team1_score: 0,
  team2_score: 0,
  server_number: 1,
  serving_team: 1,
}

export default function Remote() {
  const navigate = useNavigate()
  const [matchState, setMatchState] = useState<MatchState>(initialState)
  const [userEmail, setUserEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [lastSavedLabel, setLastSavedLabel] = useState('Not saved yet')
  const historyRef = useRef<MatchState[]>([])
  const finishChannelRef = useRef<any>(null)

  useEffect(() => {
    async function loadUserEmail() {
      const { data, error: userError } = await supabase.auth.getUser()

      if (userError) {
        setError(userError.message)
        return
      }

      const email = data.user?.email ?? ''

      if (!email) {
        setError('No signed-in email found for this session.')
        return
      }

      setUserEmail(email)
      
      // Load the match state from database
      await loadMatchState(email)
    }

    void loadUserEmail()
  }, [])

  useEffect(() => {
    if (!userEmail) {
      return
    }

    const finishChannel = supabase.channel(`match-events-${userEmail}`)
    finishChannel.subscribe()
    finishChannelRef.current = finishChannel

    return () => {
      void finishChannel.unsubscribe()
    }
  }, [userEmail])

  async function loadMatchState(email: string) {
    // Load all rows for the user to detect duplicates
    const { data, error: fetchError } = await supabase
      .from('matches')
      .select('id, team1_score, team2_score, server_number, serving_team')
      .eq('user_id', email)

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    // If no rows, create an initial row
    if (!data || data.length === 0) {
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
        setError(insertError.message)
        return
      }

      const row = Array.isArray(insertData) ? insertData[0] : insertData
      const loadedState: MatchState = {
        team1_score: row.team1_score || 0,
        team2_score: row.team2_score || 0,
        server_number: row.server_number || 1,
        serving_team: row.serving_team || 1,
      }
      setMatchState(loadedState)
      return
    }

    // If multiple rows exist, delete extras (keep the first)
    if (data.length > 1) {
      try {
        const idsToDelete = data.slice(1).map((r: any) => r.id)
        const { error: deleteError } = await supabase.from('matches').delete().in('id', idsToDelete)
        if (deleteError) console.error('Failed to delete duplicate match rows:', deleteError)
      } catch (e) {
        console.error('Error cleaning duplicate match rows', e)
      }
    }

    const row = Array.isArray(data) ? data[0] : data
    if (row) {
      const loadedState: MatchState = {
        team1_score: row.team1_score || 0,
        team2_score: row.team2_score || 0,
        server_number: row.server_number || 1,
        serving_team: row.serving_team || 1,
      }
      setMatchState(loadedState)
    }
  }

  async function saveMatchState(nextState: MatchState) {
    if (!userEmail) {
      setError('Missing user email. Sign in again to continue.')
      return
    }

    setSaving(true)
    setError('')

    const { data, error: saveError } = await supabase
      .from('matches')
      .update({
        team1_score: nextState.team1_score,
        team2_score: nextState.team2_score,
        server_number: nextState.server_number,
        serving_team: nextState.serving_team,
      })
      .eq('user_id', userEmail)
      .select('id')

    if (saveError) {
      setError(saveError.message)
    } else if (!data || data.length === 0) {
      setError('No existing match row found for this email.')
    } else {
      setLastSavedLabel(new Date().toLocaleTimeString())
    }

    setSaving(false)
  }

  function commitState(nextState: MatchState) {
    historyRef.current.push(matchState)
    setMatchState(nextState)
    void saveMatchState(nextState)
  }

  function updateTeamScore(team: 1 | 2) {
    const nextState =
      team === 1
        ? { ...matchState, team1_score: matchState.team1_score + 1 }
        : { ...matchState, team2_score: matchState.team2_score + 1 }

    commitState(nextState)
  }

  function setServer(team: 1 | 2) {
    commitState({
      ...matchState,
      server_number: team,
    })
  }

  function setServingTeam(team: 1 | 2) {
    commitState({
      ...matchState,
      serving_team: team,
      server_number: 1,
    })
  }

  function handleUndo() {
    const previousState = historyRef.current.pop()

    if (!previousState) {
      return
    }

    setMatchState(previousState)
    void saveMatchState(previousState)
  }

  function handleReset() {
    commitState(resetState)
  }

  async function handleFinishMatch() {
    if (!userEmail) {
      setError('Missing user email. Sign in again to continue.')
      return
    }

    const winner = matchState.team1_score > matchState.team2_score ? 1 : matchState.team2_score > matchState.team1_score ? 2 : 0
    const finalTeam1Score = matchState.team1_score
    const finalTeam2Score = matchState.team2_score

    setSaving(true)
    setError('')

    const { error: saveError } = await supabase
      .from('matches')
      .update({
        winner: winner,
        team1_score: 0,
        team2_score: 0,
        server_number: 1,
        serving_team: 1,
      })
      .eq('user_id', userEmail)

    if (saveError) {
      setError(saveError.message)
    } else {
      setLastSavedLabel(new Date().toLocaleTimeString())
      setMatchState(resetState)

      if (finishChannelRef.current) {
        void finishChannelRef.current.send({
          type: 'broadcast',
          event: 'match_finished',
          payload: {
            winner,
            team1_score: finalTeam1Score,
            team2_score: finalTeam2Score,
          },
        })
      }
    }

    setSaving(false)
  }

  return (
    <div className="remote-page">
      <button className="back-link" onClick={() => navigate('/dashboard')}>
        ← Back
      </button>

      <div className="remote-shell">
        <div className="remote-header">
          <div>
            <div className="remote-kicker">Remote</div>
            <h1 className="remote-title">Match controller</h1>
            <div className="remote-email">{userEmail || 'Loading signed-in user...'}</div>
          </div>

          <div className="remote-status">
            <span className={`status-dot ${saving ? 'is-saving' : ''}`} />
            <span>{saving ? 'Saving...' : 'Connected'}</span>
          </div>
        </div>

        {error && <div className="remote-error">{error}</div>}

        <div className="remote-stack">
          <section
            className={`team-card ${matchState.serving_team === 1 ? 'is-serving' : ''}`}
          >
            <div className="team-top">
              <span className="team-badge" onClick={() => setServingTeam(1)}>{matchState.serving_team === 1 ? 'SERVING' : 'RECEIVING'}</span>
              <span className="team-name">Team 1</span>
            </div>

            <div className="score-value">{String(matchState.team1_score).padStart(2, '0')}</div>

            <button className="point-button" onClick={() => updateTeamScore(1)}>
              <span className="point-plus">+</span>
              <span>POINT</span>
            </button>
          </section>

          <section
            className={`team-card ${matchState.serving_team === 2 ? 'is-serving' : ''}`}
          >
            <div className="team-top">
              <span className="team-badge" onClick={() => setServingTeam(2)}>{matchState.serving_team === 2 ? 'SERVING' : 'RECEIVING'}</span>
              <span className="team-name">Team 2</span>
            </div>

            <div className="score-value">{String(matchState.team2_score).padStart(2, '0')}</div>

            <button className="point-button" onClick={() => updateTeamScore(2)}>
              <span className="point-plus">+</span>
              <span>POINT</span>
            </button>
          </section>

          <section className="server-card">
            <div className="server-title">SERVER INDICATOR</div>
            <div className="server-options">
              <button
                className={`server-option ${matchState.server_number === 1 ? 'is-active' : ''}`}
                onClick={() => setServer(1)}
              >
                1
              </button>
              <button
                className={`server-option ${matchState.server_number === 2 ? 'is-active' : ''}`}
                onClick={() => setServer(2)}
              >
                2
              </button>
            </div>
          </section>

          <div className="action-row">
            <button className="action-button neutral" onClick={handleUndo}>
              ↶ UNDO
            </button>
            <button className="action-button danger" onClick={handleReset}>
              ⟳ RESET
            </button>
            <button className="action-button success" onClick={handleFinishMatch} disabled={saving}>
              ✓ FINISH MATCH
            </button>
          </div>

          <div className="save-meta">Last saved: {lastSavedLabel}</div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import '../auth.css'
import pickleBG from '../assets/pickleBG.png'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  async function createInitialMatchRow(userEmail: string) {
    const { error: rowError } = await supabase.from('matches').insert([
      {
        user_id: userEmail,
        team1_score: 0,
        team2_score: 0,
        server_number: 1,
        serving_team: 1,
      },
    ])

    if (rowError) {
      throw new Error(rowError.message)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      const signedUpEmail = data.user?.email ?? email

      try {
        await createInitialMatchRow(signedUpEmail)
        setSuccess(true)
      } catch (rowError) {
        setError(rowError instanceof Error ? rowError.message : 'Failed to create initial match row.')
      }

      setLoading(false)
    }
  }

  async function handleGoogleSignUp() {
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    }
  }

  return (
    <div
      className="auth-shell"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(10,10,10,0.98), rgba(15,15,15,0.96)), url(${pickleBG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="auth-card">
        <div className="brand-row">
          <div className="logo-bubble">P</div>
          <div className="brand-text">PickaScorer</div>
        </div>
        <h1 className="auth-title">Create an account</h1>
        <div className="auth-sub">Start scoring quickly — it's free to try.</div>

        {error && <div style={{color:'#ff6b6b', fontSize:'13px', marginBottom:'12px'}}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div>
            <div className="field-label">Email</div>
            <div className="input-wrap">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email or Username" required disabled={loading} />
            </div>
          </div>

          <div>
            <div className="field-label">Password</div>
            <div className="input-wrap">
              <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Create a secure key" required disabled={loading} />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} className="password-toggle" onClick={() => setShowPassword((s) => !s)}>
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.58 10.58a3 3 0 0 0 4.24 4.24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </button>
            </div>
          </div>

          <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>

          <div className="divider">Quick Access</div>

          <div className="social-row">
            <button type="button" className="social-btn" onClick={handleGoogleSignUp} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </div>

          <div style={{marginTop:18, textAlign:'center'}}>
            <div className="small">Already have an account? <Link to="/login" className="muted-link">Log in</Link></div>
          </div>
        </form>
      </div>

      {success && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'linear-gradient(180deg, rgba(6,6,6,0.98), rgba(10,10,10,0.96))', border:'1px solid rgba(255,255,255,0.02)', borderRadius:'12px', padding:'28px', maxWidth:'380px', boxShadow:'0 20px 60px rgba(2,6,23,0.6)'}}>
            <h2 style={{color:'#fff', fontSize:'20px', marginBottom:'12px', textAlign:'center'}}>Account Created!</h2>
            <p style={{color:'#a6a6a6', textAlign:'center', marginBottom:'20px', fontSize:'14px'}}>Your account is now registered. Please login to continue.</p>
            <button onClick={() => navigate('/login', { state: { email, password } })} style={{width:'100%', padding:'12px', background:'linear-gradient(90deg, #99CC33, #8cc41e)', color:'#fff', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'700'}}>OK</button>
          </div>
        </div>
      )}
    </div>
  )
}

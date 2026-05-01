import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import '../auth.css'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
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
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Create a secure key" required disabled={loading} />
            </div>
          </div>

          <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>

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

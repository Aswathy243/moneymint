import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import api from '../utils/api'
import useAuthStore from '../store/authStore'

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // State to track password visibility toggle
  const [showPassword, setShowPassword] = useState(false)

  const { login, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  // Already logged in — send to dashboard, replace history so back button won't return here
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', formData)
      login(res.data.user, res.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <style>{`
         .autofill-dark:-webkit-autofill,
         .autofill-dark:-webkit-autofill:hover, 
         .autofill-dark:-webkit-autofill:focus {
         -webkit-text-fill-color: #f1f5f9 !important;
         -webkit-box-shadow: 0 0 0px 1000px #0f172a inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }

`}</style>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 36 }}>💰</span>
          <h1 style={{ color: '#38bdf8', fontWeight: 800, fontSize: 28, margin: '8px 0 4px' }}>
            FYN<span style={{ color: '#10b981' }}>ZOVA</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Personal Finance Tracker</p>
        </div>

        {/* Card */}
        <div style={{ background: '#1e293b', borderRadius: 16, padding: 32, border: '1px solid #334155' }}>
          <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 20, margin: '0 0 6px' }}>Welcome back</h2>
          <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>Login to your account</p>

          {error && (
            <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Email</label>
            <input
                type="email"
                name="email"
                className="autofill-dark" // Added class
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
             style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Password</label>
              
              {/* Wrapper container to place button inline relative to the input */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
               <input
                 type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="autofill-dark" // Added class
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  style={{ 
                  width: '100%', 
                    background: '#0f172a', 
                    border: '1px solid #334155', 
                    borderRadius: 8, 
                    padding: '10px 44px 10px 14px', 
                    color: '#f1f5f9', 
                    fontSize: 14, 
                    outline: 'none', 
                     boxSizing: 'border-box' 
                    }}
                   />
                {/* Toggle Visibility Button */}
                <button
                  type="button" // Critical: prevents button from accidentally submitting the form
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    userSelect: 'none'
                  }}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: loading ? '#334155' : '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginTop: 20, marginBottom: 0 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
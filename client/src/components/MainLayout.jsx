import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function MainLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const userName = user?.name || 'User'
  const initial = userName.charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getLinkStyle = (path) => ({
    color: location.pathname === path ? '#38bdf8' : '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    padding: '8px 16px',
    borderRadius: '8px',
    background: location.pathname === path ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
    transition: 'all 0.2s'
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Global Header ── */}
      <header style={{
        background: '#1e293b', padding: '0 32px', display: 'flex', 
        alignItems: 'center', justifyContent: 'space-between', height: '70px',
        borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8', letterSpacing: '-0.5px' }}>
            💰 MONEYMINT
          </span>
          <nav style={{ display: 'flex', gap: '6px' }}>
            <Link to="/dashboard" style={getLinkStyle('/dashboard')}>Dashboard</Link>
            <Link to="/dashboard/transactions" style={getLinkStyle('/dashboard/transactions')}>Transactions</Link>
            <Link to="/dashboard/about" style={getLinkStyle('/dashboard/about')}>About</Link>
          </nav>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Logged in as</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{userName}</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg,#38bdf8,#818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: '#fff', fontSize: 14
          }}>
            {initial}
          </div>
          <button onClick={handleLogout} style={logoutBtnStyle}>Logout</button>
        </div>
      </header>

      {/* ── Sub-page Injection Shell ── */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        <Outlet />
      </main>
    </div>
  )
}

const logoutBtnStyle = {
  background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444',
  padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.15s'
}
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import useAuthStore from '../store/authStore'

export default function MainLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const userName = user?.name || 'User'
  const initial = userName.charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  const linkStyle = (path) => ({
    color: isActive(path) ? '#38bdf8' : '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    padding: '8px 16px',
    borderRadius: '8px',
    background: isActive(path) ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
    transition: 'all 0.2s',
    display: 'block'
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Global Header ── */}
      <header style={{
        background: '#1e293b', padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px', borderBottom: '1px solid #334155',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        {/* Logo */}
        <span style={{ fontSize: '18px', fontWeight: '800', color: '#38bdf8', letterSpacing: '-0.5px' }}>
          💰FYNZOVA
        </span>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', gap: '6px', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
          className="desktop-nav">
          <Link to="/dashboard" style={linkStyle('/dashboard')}>Dashboard</Link>
          <Link to="/dashboard/transactions" style={linkStyle('/dashboard/transactions')}>Transactions</Link>
          <Link to="/dashboard/about" style={linkStyle('/dashboard/about')}>About</Link>
        </nav>

        {/* Desktop Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="desktop-right">
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Logged in as</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{userName}</div>
          </div>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg,#38bdf8,#818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: '#fff', fontSize: 13
          }}>
            {initial}
          </div>
          <button onClick={handleLogout} style={logoutBtnStyle}>Logout</button>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="mobile-menu-btn"
          style={{
            background: 'transparent', border: 'none', color: '#94a3b8',
            fontSize: '24px', cursor: 'pointer', padding: '4px'
          }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div style={{
          background: '#1e293b', borderBottom: '1px solid #334155',
          padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '4px',
          position: 'sticky', top: '64px', zIndex: 99
        }} className="mobile-menu">
          <Link to="/dashboard" style={linkStyle('/dashboard')} onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link to="/dashboard/transactions" style={linkStyle('/dashboard/transactions')} onClick={() => setMenuOpen(false)}>Transactions</Link>
          <Link to="/dashboard/about" style={linkStyle('/dashboard/about')} onClick={() => setMenuOpen(false)}>About</Link>
          <div style={{ borderTop: '1px solid #334155', marginTop: '8px', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              Logged in as <strong style={{ color: '#fff' }}>{userName}</strong>
            </span>
            <button onClick={handleLogout} style={logoutBtnStyle}>Logout</button>
          </div>
        </div>
      )}

      {/* ── Page Content ── */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        <Outlet />
      </main>

      {/* Responsive styles */}
      <style>{`
        .desktop-nav { display: flex !important; }
        .desktop-right { display: flex !important; }
        .mobile-menu-btn { display: none !important; }
        .mobile-menu { display: none !important; }

        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .desktop-right { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .mobile-menu { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

const logoutBtnStyle = {
  background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444',
  padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.15s'
}
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const location = useLocation()

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <img src="/lexacaso.jpeg" alt="LEXACASO" className="header-logo-img" />
          <span className="header-logo-text">LEXACASO</span>
        </Link>
        <nav className="header-nav">
          <Link to="/" className={`header-link ${location.pathname === '/' ? 'active' : ''}`}>Inicio</Link>
          <Link to="/seguimiento" className={`header-link ${location.pathname === '/seguimiento' ? 'active' : ''}`}>Seguimiento</Link>
          {user && (
            <>
              <Link to="/nuevo-caso" className={`header-link ${location.pathname === '/nuevo-caso' ? 'active' : ''}`}>Nuevo Caso</Link>
              <Link to="/mis-casos" className={`header-link ${location.pathname === '/mis-casos' ? 'active' : ''}`}>Mis Casos</Link>
              <Link to="/perfil" className={`header-link ${location.pathname === '/perfil' ? 'active' : ''}`}>Perfil</Link>
            </>
          )}
          {isAdmin && (
            <Link to="/admin" className={`header-link ${location.pathname === '/admin' ? 'active' : ''}`}>Admin</Link>
          )}
          {user ? (
            <div className="header-user">
              <span className="header-user-email">{profile?.email}</span>
              {profile?.role === 'admin' && <span className="badge badge-admin">Admin</span>}
              <button onClick={signOut} className="header-link">Cerrar sesión</button>
            </div>
          ) : (
            <Link to="/login" className="header-link ingresar">Ingresar</Link>
          )}
        </nav>
      </div>
    </header>
  )
}

import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ADMIN_EMAIL } from '../lib/supabase'

export default function Header() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const location = useLocation()

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <span>LEXACASO</span>
        </Link>
        <nav className="header-nav">
          <Link to="/" className={`header-link ${location.pathname === '/' ? 'active' : ''}`}>
            Inicio
          </Link>
          <Link to="/seguimiento" className={`header-link ${location.pathname === '/seguimiento' ? 'active' : ''}`}>
            Seguimiento
          </Link>
          {user && (
            <Link to="/nuevo-caso" className={`header-link ${location.pathname === '/nuevo-caso' ? 'active' : ''}`}>
              Nuevo Caso
            </Link>
          )}
          {user && (
            <Link to="/mis-casos" className={`header-link ${location.pathname === '/mis-casos' ? 'active' : ''}`}>
              Mis Casos
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className={`header-link ${location.pathname === '/admin' ? 'active' : ''}`}>
              Admin
            </Link>
          )}
          {user ? (
            <div className="header-user">
              <span className="header-user-email">{profile?.email}</span>
              {profile?.role === 'admin' && <span className="badge badge-admin">Admin</span>}
              <button onClick={signOut} className="header-link">Cerrar sesión</button>
            </div>
          ) : (
            <Link to="/login" className="header-link">Iniciar sesión</Link>
          )}
        </nav>
      </div>
    </header>
  )
}

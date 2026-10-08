import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { user, isAdmin } = useAuth()

  return (
    <>
      <section className="hero">
        <h1>Expón tu caso</h1>
        <p>LEXACASO — Empieza por poner tu caso en orden. Presenta tu situación, adjunta documentos y recibe un número de seguimiento en tiempo real.</p>
        <div className="hero-actions">
          {user ? (
            <Link to="/nuevo-caso" className="btn btn-primary btn-lg">Presentar nuevo caso</Link>
          ) : (
            <Link to="/signup" className="btn btn-primary btn-lg">Crear cuenta</Link>
          )}
          <Link to="/seguimiento" className="btn btn-secondary btn-lg">Consultar radicado</Link>
          {isAdmin && (
            <Link to="/admin" className="btn btn-secondary btn-lg">Panel de administración</Link>
          )}
        </div>
      </section>

      <div className="main-content">
        <div className="features">
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }}>1</div>
            <h3>Registra tu caso</h3>
            <p>Completa el formulario con tus datos personales y la descripción de tu situación legal.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}>2</div>
            <h3>Adjunta documentos</h3>
            <p>Sube archivos PDF, Word, Excel, ZIP, RAR o imágenes para respaldar tu caso.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--warning-50)', color: 'var(--warning-600)' }}>3</div>
            <h3>Recibe tu radicado</h3>
            <p>Obtén un número único de seguimiento y notificación automática por correo electrónico.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--accent-100)', color: 'var(--accent-600)' }}>4</div>
            <h3>Sigue en tiempo real</h3>
            <p>Consulta el estado de tu caso en cualquier momento con tu número de radicado.</p>
          </div>
        </div>
      </div>
    </>
  )
}

import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { user, isAdmin } = useAuth()

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <p className="hero-tagline">¿No sabes por dónde empezar con tu caso?</p>
        <h1>Empieza por ponerlo en orden.</h1>
        <p>
          Organiza tus documentos, hechos y fechas. Analiza la información de tu caso
          y descubre qué aspectos requieren atención o verificación.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link to="/nuevo-caso" className="hero-btn-exponer">
              Expón tu caso &rarr;
            </Link>
          ) : (
            <Link to="/signup" className="hero-btn-exponer">
              Expón tu caso &rarr;
            </Link>
          )}
          {user ? (
            <Link to="/mis-casos" className="btn btn-secondary btn-lg">Ver mis casos</Link>
          ) : (
            <Link to="/seguimiento" className="btn btn-secondary btn-lg">Consultar radicado</Link>
          )}
          {isAdmin && <Link to="/admin" className="btn btn-secondary btn-lg">Panel de administración</Link>}
        </div>
      </section>

      {/* Three feature cards: Documentos, Análisis, Privacidad */}
      <div className="main-content">
        <div className="section-title">
          <h2>Un espacio para ordenar antes de decidir.</h2>
        </div>
        <div className="features">
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)' }}>
              &#128196;
            </div>
            <h3>Documentos</h3>
            <p>Reúne tus archivos en un solo lugar: PDF, Word, Excel, ZIP, RAR e imágenes. Todo queda asociado a tu caso.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--success-50)', color: 'var(--success-700)' }}>
              &#128202;
            </div>
            <h3>Análisis</h3>
            <p>Genera resúmenes, asuntos jurídicos y puntos para verificar. Identifica qué aspectos de tu caso requieren atención.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--neutral-100)', color: 'var(--neutral-700)' }}>
              &#128274;
            </div>
            <h3>Privacidad</h3>
            <p>Cada cliente solo puede consultar sus propios trámites y documentos. No se muestran casos públicos ni expedientes de otros.</p>
          </div>
        </div>
      </div>

      {/* Steps section */}
      <div className="steps-section">
        <div className="section-title" style={{ paddingTop: 0 }}>
          <h2>Tu caso, en buenas manos.</h2>
          <p>Una imagen jurídica, elegante y reconocible para presentar LEXACASO como un espacio serio para organizar información antes de tomar decisiones.</p>
        </div>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Expón</h3>
            <p>Escribe los hechos principales y ubica el tipo de situación.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Organiza</h3>
            <p>Reúne documentos y construye una cronología clara.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Analiza</h3>
            <p>Genera resúmenes, asuntos jurídicos y puntos para verificar.</p>
          </div>
        </div>
      </div>

      {/* Privacy section */}
      <section className="privacy-section">
        <h2>Tus expedientes no son públicos.</h2>
        <p>
          No se muestran casos de ejemplo, expedientes activos ni documentos de clientes en la página pública.
          Para consultar tus trámites debes iniciar sesión.
        </p>
        {!user && (
          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/login" className="btn btn-primary btn-lg">Ingresar</Link>
          </div>
        )}
      </section>
    </>
  )
}

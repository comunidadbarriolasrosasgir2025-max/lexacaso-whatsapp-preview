import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase, Caso, Documento, ESTADO_LABELS, ESTADO_COLORS } from '../lib/supabase'

export default function Seguimiento() {
  const [searchParams] = useSearchParams()
  const [radicado, setRadicado] = useState(searchParams.get('radicado') || '')
  const [caso, setCaso] = useState<Caso | null>(null)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  async function buscarCaso(radicadoBusqueda: string) {
    setLoading(true)
    setError('')
    setCaso(null)
    setDocumentos([])
    setSearched(true)

    if (!radicadoBusqueda.trim()) {
      setError('Ingresa un número de radicado.')
      setLoading(false)
      return
    }

    const { data, error: queryError } = await supabase
      .from('casos')
      .select('*')
      .eq('radicado', radicadoBusqueda.trim().toUpperCase())
      .maybeSingle()

    if (queryError) {
      setError('Error al buscar el caso.')
      setLoading(false)
      return
    }

    if (!data) {
      setError('No se encontró ningún caso con ese radicado.')
      setLoading(false)
      return
    }

    setCaso(data as Caso)

    const { data: docs } = await supabase
      .from('documentos')
      .select('*')
      .eq('caso_id', (data as Caso).id)
      .order('created_at', { ascending: true })

    if (docs) setDocumentos(docs as Documento[])
    setLoading(false)
  }

  useEffect(() => {
    const r = searchParams.get('radicado')
    if (r) {
      setRadicado(r)
      buscarCaso(r)
    }
  }, [searchParams])

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="main-content">
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Seguimiento de caso</h1>
        <p style={{ color: 'var(--neutral-600)', marginBottom: '1.5rem' }}>
          Ingresa tu número de radicado para consultar el estado de tu caso.
        </p>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: LEX-2026-000001"
              value={radicado}
              onChange={e => setRadicado(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscarCaso(radicado)}
            />
            <button onClick={() => buscarCaso(radicado)} className="btn btn-primary" disabled={loading}>
              {loading ? 'Buscando...' : 'Consultar'}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {caso && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginBottom: '0.25rem' }}>Radicado</p>
                <p className="radicado-display" style={{ fontSize: '1.3rem' }}>{caso.radicado}</p>
              </div>
              <span className="status-badge" style={{ background: `${ESTADO_COLORS[caso.estado]}20`, color: ESTADO_COLORS[caso.estado], fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                <span className="status-dot" style={{ background: ESTADO_COLORS[caso.estado] }} />
                {ESTADO_LABELS[caso.estado] || caso.estado}
              </span>
            </div>

            <div style={{ borderTop: '1px solid var(--neutral-100)', paddingTop: '1rem' }}>
              <div className="detail-row">
                <span className="detail-label">Nombre</span>
                <span className="detail-value">{caso.nombre}</span>
              </div>
              {caso.cedula && <div className="detail-row">
                <span className="detail-label">Cédula</span>
                <span className="detail-value">{caso.cedula}</span>
              </div>}
              {caso.telefono && <div className="detail-row">
                <span className="detail-label">Teléfono</span>
                <span className="detail-value">{caso.telefono}</span>
              </div>}
              {caso.direccion && <div className="detail-row">
                <span className="detail-label">Dirección</span>
                <span className="detail-value">{caso.direccion}</span>
              </div>}
              <div className="detail-row">
                <span className="detail-label">Correo</span>
                <span className="detail-value">{caso.correo}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Fecha de creación</span>
                <span className="detail-value">{new Date(caso.created_at).toLocaleString('es-CO')}</span>
              </div>
              {caso.descripcion && <div className="detail-row">
                <span className="detail-label">Descripción</span>
                <span className="detail-value">{caso.descripcion}</span>
              </div>}
            </div>

            {caso.respuesta_admin && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-200)' }}>
                <p style={{ fontWeight: 600, color: 'var(--primary-700)', marginBottom: '0.5rem' }}>Respuesta del equipo:</p>
                <p style={{ color: 'var(--neutral-700)', whiteSpace: 'pre-wrap' }}>{caso.respuesta_admin}</p>
              </div>
            )}

            {documentos.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.75rem' }}>Documentos adjuntos ({documentos.length})</h4>
                <div className="file-list">
                  {documentos.map(doc => (
                    <div key={doc.id} className="file-item">
                      <span style={{ fontSize: '1.2rem' }}>📄</span>
                      <span className="file-item-name">{doc.file_name}</span>
                      <span className="file-item-size">{formatBytes(doc.file_size)}</span>
                      <span className="file-item-size">{new Date(doc.created_at).toLocaleDateString('es-CO')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {caso.estado === 'recibido' && (
              <div className="alert alert-info" style={{ marginTop: '1.5rem' }}>
                Tu caso ha sido recibido y está en espera de revisión. Te notificaremos por correo cuando haya novedades.
              </div>
            )}
          </div>
        )}

        {searched && !caso && !error && !loading && (
          <div className="card empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No se encontró el caso</h3>
            <p>Verifica el número de radicado e inténtalo de nuevo.</p>
          </div>
        )}
      </div>
    </div>
  )
}

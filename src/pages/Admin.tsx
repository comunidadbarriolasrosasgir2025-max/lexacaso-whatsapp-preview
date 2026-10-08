import { useState, useEffect, FormEvent } from 'react'
import { supabase, Caso, Documento, ESTADO_LABELS, ESTADO_COLORS } from '../lib/supabase'

const ESTADO_OPTIONS = ['recibido', 'en_revision', 'respondido', 'cerrado']

export default function Admin() {
  const [casos, setCasos] = useState<Caso[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedCaso, setSelectedCaso] = useState<Caso | null>(null)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [editModal, setEditModal] = useState(false)
  const [editEstado, setEditEstado] = useState('')
  const [editRespuesta, setEditRespuesta] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  async function loadCasos() {
    setLoading(true)
    let query = supabase.from('casos').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') {
      query = query.eq('estado', filter)
    }
    if (search.trim()) {
      query = query.or(`radicado.ilike.%${search}%,nombre.ilike.%${search}%,correo.ilike.%${search}%`)
    }
    const { data } = await query
    if (data) setCasos(data as Caso[])
    setLoading(false)
  }

  useEffect(() => {
    loadCasos()
  }, [filter, search])

  async function openDetail(caso: Caso) {
    setSelectedCaso(caso)
    setEditModal(false)
    setDeleteConfirm(false)
    const { data: docs } = await supabase
      .from('documentos')
      .select('*')
      .eq('caso_id', caso.id)
      .order('created_at', { ascending: true })
    if (docs) setDocumentos(docs as Documento[])
  }

  function openEdit(caso: Caso) {
    setEditEstado(caso.estado)
    setEditRespuesta(caso.respuesta_admin || '')
    setEditModal(true)
    setDeleteConfirm(false)
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault()
    if (!selectedCaso) return
    setSaving(true)

    const { data, error } = await supabase
      .from('casos')
      .update({
        estado: editEstado,
        respuesta_admin: editRespuesta,
      })
      .eq('id', selectedCaso.id)
      .select()
      .single()

    if (!error && data) {
      setSelectedCaso(data as Caso)
      setCasos(prev => prev.map(c => c.id === (data as Caso).id ? (data as Caso) : c))
      setEditModal(false)
    }
    setSaving(false)
  }

  async function deleteCaso() {
    if (!selectedCaso) return
    setSaving(true)

    const { data: docs } = await supabase
      .from('documentos')
      .select('storage_path')
      .eq('caso_id', selectedCaso.id)

    if (docs && docs.length > 0) {
      const paths = docs.map(d => d.storage_path)
      await supabase.storage.from('documentos').remove(paths)
    }

    const { error } = await supabase
      .from('casos')
      .delete()
      .eq('id', selectedCaso.id)

    if (!error) {
      setCasos(prev => prev.filter(c => c.id !== selectedCaso.id))
      setSelectedCaso(null)
      setDeleteConfirm(false)
    }
    setSaving(false)
  }

  async function deleteDocumento(doc: Documento) {
    await supabase.storage.from('documentos').remove([doc.storage_path])
    const { error } = await supabase
      .from('documentos')
      .delete()
      .eq('id', doc.id)

    if (!error) {
      setDocumentos(prev => prev.filter(d => d.id !== doc.id))
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className="main-content">
      <h1 style={{ marginBottom: '0.5rem' }}>Panel de administración</h1>
      <p style={{ color: 'var(--neutral-600)', marginBottom: '1.5rem' }}>
        Gestiona todos los casos, cambia estados y responde a los clientes.
      </p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select className="form-select" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Todos los estados</option>
          {ESTADO_OPTIONS.map(est => (
            <option key={est} value={est}>{ESTADO_LABELS[est]}</option>
          ))}
        </select>
        <input
          type="text"
          className="form-input"
          style={{ maxWidth: 300 }}
          placeholder="Buscar por radicado, nombre o correo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {casos.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No hay casos</h3>
          <p>No se encontraron casos con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Radicado</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Docs</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {casos.map(caso => (
                <tr key={caso.id}>
                  <td className="radicado-display">{caso.radicado}</td>
                  <td>{caso.nombre}</td>
                  <td style={{ fontSize: '0.85rem' }}>{caso.correo}</td>
                  <td style={{ fontSize: '0.85rem' }}>{new Date(caso.created_at).toLocaleDateString('es-CO')}</td>
                  <td>
                    <span className="status-badge" style={{ background: `${ESTADO_COLORS[caso.estado]}20`, color: ESTADO_COLORS[caso.estado] }}>
                      <span className="status-dot" style={{ background: ESTADO_COLORS[caso.estado] }} />
                      {ESTADO_LABELS[caso.estado] || caso.estado}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>—</td>
                  <td>
                    <button onClick={() => openDetail(caso)} className="btn btn-ghost btn-sm">
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedCaso && !editModal && (
        <div className="modal-overlay" onClick={() => setSelectedCaso(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Caso {selectedCaso.radicado}</h2>
              <button className="modal-close" onClick={() => setSelectedCaso(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Estado actual</span>
                <span className="detail-value">
                  <span className="status-badge" style={{ background: `${ESTADO_COLORS[selectedCaso.estado]}20`, color: ESTADO_COLORS[selectedCaso.estado] }}>
                    <span className="status-dot" style={{ background: ESTADO_COLORS[selectedCaso.estado] }} />
                    {ESTADO_LABELS[selectedCaso.estado] || selectedCaso.estado}
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Nombre</span>
                <span className="detail-value">{selectedCaso.nombre}</span>
              </div>
              {selectedCaso.cedula && <div className="detail-row">
                <span className="detail-label">Cédula</span>
                <span className="detail-value">{selectedCaso.cedula}</span>
              </div>}
              {selectedCaso.telefono && <div className="detail-row">
                <span className="detail-label">Teléfono</span>
                <span className="detail-value">{selectedCaso.telefono}</span>
              </div>}
              {selectedCaso.direccion && <div className="detail-row">
                <span className="detail-label">Dirección</span>
                <span className="detail-value">{selectedCaso.direccion}</span>
              </div>}
              <div className="detail-row">
                <span className="detail-label">Correo</span>
                <span className="detail-value">{selectedCaso.correo}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Fecha</span>
                <span className="detail-value">{new Date(selectedCaso.created_at).toLocaleString('es-CO')}</span>
              </div>
              {selectedCaso.descripcion && <div className="detail-row">
                <span className="detail-label">Descripción</span>
                <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{selectedCaso.descripcion}</span>
              </div>}
              {selectedCaso.respuesta_admin && <div className="detail-row">
                <span className="detail-label">Respuesta</span>
                <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{selectedCaso.respuesta_admin}</span>
              </div>}

              {documentos.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: '0.75rem' }}>Documentos ({documentos.length})</h4>
                  <div className="file-list">
                    {documentos.map(doc => (
                      <div key={doc.id} className="file-item">
                        <span style={{ fontSize: '1.2rem' }}>📄</span>
                        <span className="file-item-name">{doc.file_name}</span>
                        <span className="file-item-size">{formatBytes(doc.file_size)}</span>
                        <span className="file-item-size">{new Date(doc.created_at).toLocaleDateString('es-CO')}</span>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteDocumento(doc)}>
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {deleteConfirm && (
                <div className="alert alert-error" style={{ marginTop: '1rem' }}>
                  ¿Estás seguro? Se eliminará el caso y todos sus documentos permanentemente.
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button className="btn btn-danger btn-sm" onClick={deleteCaso} disabled={saving}>
                      {saving ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {!deleteConfirm && (
                <>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(true)}>
                    Eliminar caso
                  </button>
                  <button className="btn btn-secondary" onClick={() => setSelectedCaso(null)}>
                    Cerrar
                  </button>
                  <button className="btn btn-primary" onClick={() => openEdit(selectedCaso)}>
                    Editar / Responder
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedCaso && editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Editar caso {selectedCaso.radicado}</h2>
              <button className="modal-close" onClick={() => setEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={saveEdit}>
                <div className="form-group">
                  <label className="form-label">Estado del caso</label>
                  <select className="form-select" value={editEstado} onChange={e => setEditEstado(e.target.value)}>
                    {ESTADO_OPTIONS.map(est => (
                      <option key={est} value={est}>{ESTADO_LABELS[est]}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Respuesta al cliente</label>
                  <textarea
                    className="form-textarea"
                    value={editRespuesta}
                    onChange={e => setEditRespuesta(e.target.value)}
                    placeholder="Escribe la respuesta o comentario para el cliente..."
                    rows={5}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

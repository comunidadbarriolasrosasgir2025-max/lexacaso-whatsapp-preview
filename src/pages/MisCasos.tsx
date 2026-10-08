import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, Caso, ESTADO_LABELS, ESTADO_COLORS } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function MisCasos() {
  const { user } = useAuth()
  const [casos, setCasos] = useState<Caso[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCasos() {
      if (!user) return
      const { data, error } = await supabase
        .from('casos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setCasos(data as Caso[])
      }
      setLoading(false)
    }
    loadCasos()
  }, [user])

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Mis casos</h1>
        <Link to="/nuevo-caso" className="btn btn-primary">Presentar nuevo caso</Link>
      </div>

      {casos.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No tienes casos registrados</h3>
          <p style={{ marginBottom: '1rem' }}>Presenta tu primer caso para comenzar.</p>
          <Link to="/nuevo-caso" className="btn btn-primary">Crear caso</Link>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Radicado</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Descripción</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {casos.map(caso => (
                <tr key={caso.id}>
                  <td className="radicado-display">{caso.radicado}</td>
                  <td>{new Date(caso.created_at).toLocaleDateString('es-CO')}</td>
                  <td>
                    <span className="status-badge" style={{ background: `${ESTADO_COLORS[caso.estado]}20`, color: ESTADO_COLORS[caso.estado] }}>
                      <span className="status-dot" style={{ background: ESTADO_COLORS[caso.estado] }} />
                      {ESTADO_LABELS[caso.estado] || caso.estado}
                    </span>
                  </td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {caso.descripcion || '-'}
                  </td>
                  <td>
                    <Link to={`/seguimiento?radicado=${caso.radicado}`} className="btn btn-ghost btn-sm">
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

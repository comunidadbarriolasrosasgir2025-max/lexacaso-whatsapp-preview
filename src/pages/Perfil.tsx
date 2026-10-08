import { useState, FormEvent, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Perfil() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [cedula, setCedula] = useState(profile?.cedula || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [address, setAddress] = useState(profile?.address || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setCedula(profile.cedula || '')
      setPhone(profile.phone || '')
      setAddress(profile.address || '')
    }
  }, [profile])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        cedula,
        phone,
        address,
      })
      .eq('id', user!.id)

    if (updateError) {
      setError('Error al guardar el perfil.')
      setSaving(false)
      return
    }

    await refreshProfile()
    setSaved(true)
    setSaving(false)
  }

  return (
    <div className="main-content">
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Mi perfil</h1>
        <p style={{ color: 'var(--neutral-600)', marginBottom: '2rem' }}>
          Actualiza tus datos personales. Esta información se sincroniza automáticamente.
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {saved && <div className="alert alert-success">Perfil actualizado correctamente.</div>}

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="detail-row">
            <span className="detail-label">Correo</span>
            <span className="detail-value">{profile?.email}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Rol</span>
            <span className="detail-value">
              {profile?.role === 'admin' ? (
                <span className="badge badge-admin">Administrador</span>
              ) : (
                <span className="badge badge-cliente">Cliente</span>
              )}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Datos personales</h3>

            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cédula</label>
              <input
                type="text"
                className="form-input"
                value={cedula}
                onChange={e => setCedula(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Dirección</label>
              <input
                type="text"
                className="form-input"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

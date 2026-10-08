import { useState, useRef, useCallback, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isFileAllowed, MAX_FILE_SIZE, ALLOWED_EXTENSIONS, Caso, Documento } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface UploadedFile {
  file: File
  uploaded: boolean
  storage_path: string
  error?: string
}

export default function NuevoCaso() {
  const { user, profile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    nombre: profile?.full_name || '',
    cedula: profile?.cedula || '',
    telefono: profile?.phone || '',
    direccion: profile?.address || '',
    correo: user?.email || '',
    descripcion: '',
  })

  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ radicado: string; casoId: string } | null>(null)
  const [dragging, setDragging] = useState(false)

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = useCallback(async (selectedFiles: FileList | File[]) => {
    setError('')
    const newFiles: UploadedFile[] = []

    for (const file of Array.from(selectedFiles)) {
      if (!isFileAllowed(file)) {
        newFiles.push({ file, uploaded: false, storage_path: '', error: 'Formato no permitido' })
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        newFiles.push({ file, uploaded: false, storage_path: '', error: 'Archivo demasiado grande (máx 25MB)' })
        continue
      }
      newFiles.push({ file, uploaded: false, storage_path: '' })
    }

    setFiles(prev => [...prev, ...newFiles])

    setUploading(true)
    for (let i = 0; i < newFiles.length; i++) {
      const uf = newFiles[i]
      if (uf.error) continue

      const fileExt = uf.file.name.split('.').pop()
      const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(fileName, uf.file)

      if (uploadError) {
        setFiles(prev => prev.map((f, idx) => {
          const targetIdx = prev.length - newFiles.length + i
          return idx === targetIdx ? { ...f, error: 'Error al subir' } : f
        }))
      } else {
        setFiles(prev => prev.map((f, idx) => {
          const targetIdx = prev.length - newFiles.length + i
          return idx === targetIdx ? { ...f, uploaded: true, storage_path: fileName } : f
        }))
      }
    }
    setUploading(false)
  }, [user])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [handleFileSelect])

  const removeFile = async (index: number) => {
    const uf = files[index]
    if (uf.uploaded && uf.storage_path) {
      await supabase.storage.from('documentos').remove([uf.storage_path])
    }
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (!formData.nombre.trim() || !formData.correo.trim()) {
      setError('Nombre y correo son obligatorios.')
      setSubmitting(false)
      return
    }

    const pendingUploads = files.filter(f => !f.uploaded && !f.error)
    if (pendingUploads.length > 0) {
      setError('Hay archivos que aún se están subiendo. Espera un momento.')
      setSubmitting(false)
      return
    }

    const failedFiles = files.filter(f => f.error)
    if (failedFiles.length > 0) {
      setError('Algunos archivos tienen errores. Elimínalos antes de enviar.')
      setSubmitting(false)
      return
    }

    const { data: radicado } = await supabase.rpc('generate_radicado')

    const { data: caso, error: insertError } = await supabase
      .from('casos')
      .insert({
        radicado: radicado as string,
        nombre: formData.nombre,
        cedula: formData.cedula,
        telefono: formData.telefono,
        direccion: formData.direccion,
        correo: formData.correo,
        descripcion: formData.descripcion,
        user_id: user!.id,
      })
      .select()
      .single()

    if (insertError || !caso) {
      setError('Error al crear el caso. Inténtalo de nuevo.')
      setSubmitting(false)
      return
    }

    const uploadedDocs: Documento[] = []
    for (const uf of files) {
      if (!uf.uploaded || !uf.storage_path) continue
      const { data: doc } = await supabase
        .from('documentos')
        .insert({
          caso_id: caso.id,
          user_id: user!.id,
          file_name: uf.file.name,
          file_type: uf.file.type,
          file_size: uf.file.size,
          storage_path: uf.storage_path,
        })
        .select()
        .single()
      if (doc) uploadedDocs.push(doc as Documento)
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notificar-caso`
      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          radicado: caso.radicado,
          correo: formData.correo,
          nombre: formData.nombre,
          cedula: formData.cedula,
          telefono: formData.telefono,
          direccion: formData.direccion,
          descripcion: formData.descripcion,
          documentos: uploadedDocs.map(d => ({
            file_name: d.file_name,
            file_type: d.file_type,
            file_size: d.file_size,
            created_at: d.created_at,
          })),
          seguimientoUrl: `${window.location.origin}/seguimiento?radicado=${caso.radicado}`,
        }),
      })
    } catch {
      // Email notification is best-effort; the case is already saved
    }

    await supabase
      .from('profiles')
      .update({
        full_name: formData.nombre,
        cedula: formData.cedula,
        phone: formData.telefono,
        address: formData.direccion,
      })
      .eq('id', user!.id)

    setSuccess({ radicado: caso.radicado, casoId: caso.id })
    setSubmitting(false)
  }

  function handleNuevoCaso() {
    setFormData({
      nombre: profile?.full_name || '',
      cedula: profile?.cedula || '',
      telefono: profile?.phone || '',
      direccion: profile?.address || '',
      correo: user?.email || '',
      descripcion: '',
    })
    setFiles([])
    setError('')
    setSuccess(null)
  }

  if (success) {
    return (
      <div className="main-content">
        <div className="card" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div className="success-icon">✓</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Caso registrado con éxito</h2>
          <p style={{ color: 'var(--neutral-600)', marginBottom: '1.5rem' }}>
            Tu caso ha sido creado. Te hemos enviado una notificación por correo con todos los detalles.
          </p>
          <div style={{ background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--neutral-600)', marginBottom: '0.3rem' }}>Tu número de radicado:</p>
            <p className="radicado-display" style={{ fontSize: '1.4rem' }}>{success.radicado}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={`/seguimiento?radicado=${success.radicado}`} className="btn btn-primary">
              Ver seguimiento
            </Link>
            <button onClick={handleNuevoCaso} className="btn btn-secondary">
              Presentar otro caso
            </button>
            <Link to="/mis-casos" className="btn btn-ghost">
              Ver mis casos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Presentar nuevo caso</h1>
        <p style={{ color: 'var(--neutral-600)', marginBottom: '2rem' }}>
          Completa el formulario con tus datos y adjunta los documentos relevantes.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Datos personales</h3>

            <div className="form-group">
              <label className="form-label">Nombre completo <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                value={formData.nombre}
                onChange={e => updateField('nombre', e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Cédula</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.cedula}
                  onChange={e => updateField('cedula', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.telefono}
                  onChange={e => updateField('telefono', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Dirección</label>
              <input
                type="text"
                className="form-input"
                value={formData.direccion}
                onChange={e => updateField('direccion', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Correo electrónico <span className="required">*</span></label>
              <input
                type="email"
                className="form-input"
                value={formData.correo}
                onChange={e => updateField('correo', e.target.value)}
                required
              />
              <p className="form-hint">A este correo recibirás la notificación con tu radicado.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción del caso</label>
              <textarea
                className="form-textarea"
                value={formData.descripcion}
                onChange={e => updateField('descripcion', e.target.value)}
                placeholder="Describe tu situación legal en detalle..."
                rows={5}
              />
            </div>
          </div>

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Documentos adjuntos</h3>
            <p style={{ color: 'var(--neutral-600)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Formatos permitidos: {ALLOWED_EXTENSIONS.join(', ')}. Tamaño máximo: 25MB por archivo.
            </p>

            <div
              className={`file-upload-zone ${dragging ? 'dragging' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div className="file-upload-icon">📎</div>
              <p className="file-upload-text">
                Arrastra archivos aquí o haz clic para seleccionar
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff"
              onChange={e => {
                if (e.target.files?.length) handleFileSelect(e.target.files)
                e.target.value = ''
              }}
            />

            {files.length > 0 && (
              <div className="file-list">
                {files.map((uf, i) => (
                  <div key={i} className="file-item">
                    <span style={{ fontSize: '1.2rem' }}>
                      {uf.error ? '⚠️' : uf.uploaded ? '✅' : uploading ? '⏳' : '📄'}
                    </span>
                    <span className="file-item-name">{uf.file.name}</span>
                    <span className="file-item-size">{(uf.file.size / 1024).toFixed(1)} KB</span>
                    {uf.error && <span style={{ color: 'var(--error-600)', fontSize: '0.8rem' }}>{uf.error}</span>}
                    <button type="button" className="file-item-remove" onClick={() => removeFile(i)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Link to="/mis-casos" className="btn btn-ghost">Cancelar</Link>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting || uploading}>
              {submitting ? 'Enviando...' : 'Enviar caso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

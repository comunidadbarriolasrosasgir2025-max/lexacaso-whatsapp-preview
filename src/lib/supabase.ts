import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export const ADMIN_EMAIL = 'notipersonales2026@gmail.com'

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
]

export const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff',
]

export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

export function isFileAllowed(file: File): boolean {
  const name = file.name.toLowerCase()
  const extMatch = ALLOWED_EXTENSIONS.some(ext => name.endsWith(ext))
  const typeMatch = ALLOWED_FILE_TYPES.includes(file.type)
  return extMatch || typeMatch
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'cliente'
  phone: string
  cedula: string
  address: string
  created_at: string
  updated_at: string
}

export interface Caso {
  id: string
  radicado: string
  user_id: string
  nombre: string
  cedula: string
  telefono: string
  direccion: string
  correo: string
  descripcion: string
  estado: string
  respuesta_admin: string
  created_at: string
  updated_at: string
}

export interface Documento {
  id: string
  caso_id: string
  user_id: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  created_at: string
}

export const ESTADO_LABELS: Record<string, string> = {
  recibido: 'Recibido',
  en_revision: 'En Revisión',
  respondido: 'Respondido',
  cerrado: 'Cerrado',
}

export const ESTADO_COLORS: Record<string, string> = {
  recibido: '#2563eb',
  en_revision: '#d97706',
  respondido: '#059669',
  cerrado: '#64748b',
}

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string, currentUserEmail?: string | null) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error loading profile:', error)
    }

    const email = currentUserEmail?.toLowerCase()
    
    // Si el perfil existe en Supabase
    if (data) {
      const updatedProfile = {
        ...(data as Profile),
        // Forzar rol de admin si el correo es notipersonales2026@gmail.com
        role: email === 'notipersonales2026@gmail.com' ? 'admin' : (data.role || 'client')
      }
      setProfile(updatedProfile)
      return updatedProfile
    }

    // Si aún no existe fila en la tabla profiles
    const fallbackProfile: Profile = {
      id: userId,
      role: email === 'notipersonales2026@gmail.com' ? 'admin' : 'client',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setProfile(fallbackProfile)
    return fallbackProfile
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id, session.user.email).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        (async () => {
          await loadProfile(session.user.id, session.user.email)
          setLoading(false)
        })()
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id, user.email)
    }
  }

  // Confirmar la condición de Administrador
  const isAdmin = user?.email?.toLowerCase() === 'notipersonales2026@gmail.com' || profile?.role === 'admin'

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, isAdmin, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import NuevoCaso from './pages/NuevoCaso'
import MisCasos from './pages/MisCasos'
import Seguimiento from './pages/Seguimiento'
import Perfil from './pages/Perfil'
import Admin from './pages/Admin'
import Header from './components/Header'
import Footer from './components/Footer'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const { user } = useAuth()
  const location = useLocation()
  const hideHeader = ['/login', '/signup'].includes(location.pathname)

  return (
    <div className="app-container">
      {!hideHeader && <Header />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
        <Route path="/seguimiento" element={<Seguimiento />} />
        <Route path="/nuevo-caso" element={
          <ProtectedRoute><NuevoCaso /></ProtectedRoute>
        } />
        <Route path="/mis-casos" element={
          <ProtectedRoute><MisCasos /></ProtectedRoute>
        } />
        <Route path="/perfil" element={
          <ProtectedRoute><Perfil /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute><Admin /></AdminRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {!hideHeader && <Footer />}
    </div>
  )
}

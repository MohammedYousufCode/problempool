import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Problems from './pages/Problems'
import ProblemDetail from './pages/ProblemDetail'
import Submit from './pages/Submit'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100dvh - 64px)' }}>
        <Routes>
          <Route path="/"            element={<Landing />} />
          <Route path="/auth"        element={<Auth />} />
          <Route path="/problems"    element={<Problems />} />
          <Route path="/problems/:id" element={<ProblemDetail />} />
          <Route path="/submit"      element={<ProtectedRoute><Submit /></ProtectedRoute>} />
          <Route path="/profile"     element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin"       element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
import { type ReactNode } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { StoreProvider, useStore } from './context/StoreContext'
import Layout from './components/Layout'
import Spinner from './components/Spinner'
import WelcomePage from './pages/WelcomePage'
import LanguagePage from './pages/LanguagePage'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import FarmPage from './pages/FarmPage'
import WeatherPage from './pages/WeatherPage'
import AdvicePage from './pages/AdvicePage'
import AlertsPage from './pages/AlertsPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import AdminPage from './pages/admin/AdminPage'
import NotFoundPage from './pages/NotFoundPage'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/welcome" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

function NeedsOnboarding({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { farms, loading: storeLoading } = useStore()
  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }
  if (user?.role !== 'admin' && farms.length === 0) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/language" element={<LanguagePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/onboarding" element={<ProtectedLayout><OnboardingPage /></ProtectedLayout>} />

      {/* Authenticated app shell */}
      <Route
        element={
          <ProtectedLayout>
            <NeedsOnboarding>
              <Layout />
            </NeedsOnboarding>
          </ProtectedLayout>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/farm" element={<FarmPage />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/advice" element={<AdvicePage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedLayout>
            <AdminRoute>
              <Layout isAdmin />
            </AdminRoute>
          </ProtectedLayout>
        }
      >
        <Route index element={<AdminPage />} />
      </Route>

      <Route
        element={
          <ProtectedLayout>
            <Layout />
          </ProtectedLayout>
        }
      >
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppRoutes />
      </StoreProvider>
    </AuthProvider>
  )
}

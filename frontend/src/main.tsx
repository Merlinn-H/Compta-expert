import { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'

import { useAppStore } from './store/useAppStore'
import Layout from './components/Layout'

// Lazy-load every page — each becomes its own JS chunk loaded on demand.
// Auth pages are tiny and load instantly; heavy pages (Dashboard with Recharts,
// Reports with PDF logic) are only fetched when the user navigates there.
const LoginPage       = lazy(() => import('./pages/LoginPage'))
const RegisterPage    = lazy(() => import('./pages/RegisterPage'))
const DashboardPage   = lazy(() => import('./pages/DashboardPage'))
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'))
const TaxQuebecPage   = lazy(() => import('./pages/TaxQuebecPage'))
const TaxFrancePage   = lazy(() => import('./pages/TaxFrancePage'))
const ReportsPage     = lazy(() => import('./pages/ReportsPage'))
const SettingsPage    = lazy(() => import('./pages/SettingsPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

function Spinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAppStore((s) => s.token)
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" replace />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/"
            element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/transactions"
            element={<PrivateRoute><TransactionsPage /></PrivateRoute>} />
          <Route path="/tax/quebec"
            element={<PrivateRoute><TaxQuebecPage /></PrivateRoute>} />
          <Route path="/tax/france"
            element={<PrivateRoute><TaxFrancePage /></PrivateRoute>} />
          <Route path="/reports"
            element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
          <Route path="/settings"
            element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </QueryClientProvider>
)

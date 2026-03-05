import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'

import { useAppStore } from './store/useAppStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import TaxQuebecPage from './pages/TaxQuebecPage'
import TaxFrancePage from './pages/TaxFrancePage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAppStore((s) => s.token)
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" replace />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={<PrivateRoute><DashboardPage /></PrivateRoute>}
          />
          <Route
            path="/transactions"
            element={<PrivateRoute><TransactionsPage /></PrivateRoute>}
          />
          <Route
            path="/tax/quebec"
            element={<PrivateRoute><TaxQuebecPage /></PrivateRoute>}
          />
          <Route
            path="/tax/france"
            element={<PrivateRoute><TaxFrancePage /></PrivateRoute>}
          />
          <Route
            path="/reports"
            element={<PrivateRoute><ReportsPage /></PrivateRoute>}
          />
          <Route
            path="/settings"
            element={<PrivateRoute><SettingsPage /></PrivateRoute>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Leaf } from 'lucide-react'
import { api } from '../utils/api'
import { useAppStore } from '../store/useAppStore'
import { useT } from '../hooks/useT'
import type { AuthToken } from '../types'

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const t = useT()
  const navigate = useNavigate()
  const { setAuth } = useAppStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post<AuthToken>('/auth/login', data)
      setAuth(res.data.user, res.data.access_token)
      navigate('/')
    } catch {
      setError(t('error') + ': email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-white text-2xl font-bold mb-2">
            <Leaf size={28} className="text-emerald-400" />
            Compta Expert
          </div>
          <p className="text-slate-400 text-sm">Comptabilité bilingue • Québec & France</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-xl font-bold text-slate-900 mb-6">{t('loginTitle')}</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('email')}</label>
              <input
                type="email"
                {...register('email', { required: true })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="vous@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('password')}</label>
              <input
                type="password"
                {...register('password', { required: true })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {loading ? t('loading') : t('login')}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            {t('noAccount')}{' '}
            <Link to="/register" className="text-emerald-600 hover:underline font-medium">
              {t('register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

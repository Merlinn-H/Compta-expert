import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Leaf } from 'lucide-react'
import { api } from '../utils/api'
import { useAppStore } from '../store/useAppStore'
import { useT } from '../hooks/useT'
import type { AuthToken } from '../types'

interface RegisterForm {
  email: string
  password: string
  full_name: string
  preferred_language: 'fr' | 'en'
  default_currency: 'CAD' | 'EUR'
}

export default function RegisterPage() {
  const t = useT()
  const navigate = useNavigate()
  const { setAuth } = useAppStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm<RegisterForm>({
    defaultValues: { preferred_language: 'fr', default_currency: 'CAD' },
  })

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post<AuthToken>('/auth/register', data)
      setAuth(res.data.user, res.data.access_token)
      navigate('/')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail || 'Erreur lors de l\'inscription')
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
          <h1 className="text-xl font-bold text-slate-900 mb-6">{t('registerTitle')}</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('fullName')}</label>
              <input
                type="text"
                {...register('full_name')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('email')}</label>
              <input
                type="email"
                {...register('email', { required: true })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('password')}</label>
              <input
                type="password"
                {...register('password', { required: true, minLength: 8 })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('preferredLanguage')}</label>
                <select
                  {...register('preferred_language')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('defaultCurrency')}</label>
                <select
                  {...register('default_currency')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="CAD">CAD 🇨🇦</option>
                  <option value="EUR">EUR 🇪🇺</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {loading ? t('loading') : t('register')}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            {t('hasAccount')}{' '}
            <Link to="/login" className="text-emerald-600 hover:underline font-medium">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

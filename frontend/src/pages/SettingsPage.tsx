import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { api } from '../utils/api'
import { useAppStore } from '../store/useAppStore'
import { useT } from '../hooks/useT'
import type { User } from '../types'

interface SettingsForm {
  full_name: string
  preferred_language: 'fr' | 'en'
  default_currency: 'CAD' | 'EUR'
  fiscal_year_start: number
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export default function SettingsPage() {
  const t = useT()
  const { user, setAuth, token, setLanguage, language } = useAppStore()
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit } = useForm<SettingsForm>({
    defaultValues: {
      full_name: user?.full_name || '',
      preferred_language: user?.preferred_language || 'fr',
      default_currency: user?.default_currency || 'CAD',
      fiscal_year_start: user?.fiscal_year_start || 1,
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      const res = await api.put<User>('/auth/me', data)
      return res.data
    },
    onSuccess: (updatedUser) => {
      setAuth(updatedUser, token!)
      setLanguage(updatedUser.preferred_language)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('settings')}</h1>
        <p className="text-slate-500 text-sm">{user?.email}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('fullName')}</label>
            <input
              type="text"
              {...register('full_name')}
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
                <option value="fr">🇫🇷 Français</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('defaultCurrency')}</label>
              <select
                {...register('default_currency')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="CAD">🇨🇦 CAD</option>
                <option value="EUR">🇪🇺 EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('fiscalYearStart')}</label>
            <select
              {...register('fiscal_year_start', { valueAsNumber: true })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
            >
              {MONTHS_FR.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>{name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {saved && <Check size={16} />}
              {mutation.isPending ? t('loading') : saved ? t('success') + ' !' : t('saveSettings')}
            </button>
          </div>
        </form>
      </div>

      {/* Language quick toggle */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Langue d'affichage rapide</h2>
        <div className="flex gap-3">
          {(['fr', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                language === lang
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-500'
              }`}
            >
              {lang === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Ce toggle change l'affichage immédiatement. Sauvegardez les paramètres pour le persister.
        </p>
      </div>

      {/* App info */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-800 mb-2">À propos</h2>
        <p>Compta Expert v1.0 — Application de comptabilité bilingue pour le Québec et la France.</p>
        <p className="mt-1">Taux de change historiques: <span className="font-mono text-xs">Frankfurter API (api.frankfurter.app)</span></p>
        <p className="mt-1 text-xs text-slate-400">
          Tous les taux de change sont récupérés à la date de la transaction et stockés de façon permanente.
          Les montants ne sont jamais recalculés avec des taux actuels.
        </p>
      </div>
    </div>
  )
}

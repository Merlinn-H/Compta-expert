import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { api, formatCurrency } from '../utils/api'
import { useT } from '../hooks/useT'

interface CA3Data {
  year: number
  month: number
  period: string
  ca_ht: number
  tva_collectee: { by_rate: Record<string, number>; total: number }
  tva_deductible: { by_rate: Record<string, number>; total: number }
  tva_a_payer: number
  credit_tva: number
  transaction_count: number
}

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export default function TaxFrancePage() {
  const t = useT()
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [downloadingFec, setDownloadingFec] = useState(false)

  const { data: ca3, isLoading } = useQuery({
    queryKey: ['tax', 'france', 'ca3', year, month],
    queryFn: async () => {
      const res = await api.get<CA3Data>('/tax/france/ca3', { params: { year, month } })
      return res.data
    },
  })

  const downloadFec = async () => {
    setDownloadingFec(true)
    try {
      const token = localStorage.getItem('compta-expert-store')
      const res = await api.get(`/tax/france/fec?year=${year}`, {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `FEC_${year}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloadingFec(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🇫🇷</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('taxFrance')}</h1>
            <p className="text-slate-500 text-sm">TVA • CA3 • FEC</p>
          </div>
        </div>
        <button
          onClick={downloadFec}
          disabled={downloadingFec}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50 transition-colors"
        >
          <Download size={16} />
          {downloadingFec ? t('loading') : t('downloadFEC')} {year}
        </button>
      </div>

      {/* Period selectors */}
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('year')}</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
          >
            {[2022, 2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('month')}</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
          >
            {MONTH_NAMES_FR.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-slate-400">{t('loading')}</div>
      ) : ca3 ? (
        <div className="space-y-4">
          {/* CA3 summary */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-800">
                Déclaration CA3 — {MONTH_NAMES_FR[ca3.month - 1]} {ca3.year}
              </h2>
              <p className="text-xs text-slate-500">{ca3.period} • {ca3.transaction_count} transactions</p>
            </div>

            <div className="p-4 space-y-4">
              {/* CA HT */}
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">{t('caHT')}</span>
                <span className="font-bold text-slate-900">{formatCurrency(ca3.ca_ht, 'EUR')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* TVA collectée */}
                <div className="border border-red-200 rounded-xl p-4 bg-red-50">
                  <h3 className="font-semibold text-red-800 mb-3">{t('tvaCollectee')}</h3>
                  {Object.entries(ca3.tva_collectee.by_rate).map(([rate, amount]) => (
                    <div key={rate} className="flex justify-between text-sm py-1">
                      <span className="text-red-700">TVA {rate}</span>
                      <span className="font-medium text-red-900">{formatCurrency(amount, 'EUR')}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-red-200 pt-2 mt-2 font-semibold text-sm">
                    <span className="text-red-800">{t('total')}</span>
                    <span className="text-red-900">{formatCurrency(ca3.tva_collectee.total, 'EUR')}</span>
                  </div>
                </div>

                {/* TVA déductible */}
                <div className="border border-green-200 rounded-xl p-4 bg-green-50">
                  <h3 className="font-semibold text-green-800 mb-3">{t('tvaDeductible')}</h3>
                  {Object.entries(ca3.tva_deductible.by_rate).length === 0 ? (
                    <p className="text-green-600 text-sm italic">Aucune TVA déductible</p>
                  ) : (
                    Object.entries(ca3.tva_deductible.by_rate).map(([rate, amount]) => (
                      <div key={rate} className="flex justify-between text-sm py-1">
                        <span className="text-green-700">TVA {rate}</span>
                        <span className="font-medium text-green-900">{formatCurrency(amount, 'EUR')}</span>
                      </div>
                    ))
                  )}
                  <div className="flex justify-between border-t border-green-200 pt-2 mt-2 font-semibold text-sm">
                    <span className="text-green-800">{t('total')}</span>
                    <span className="text-green-900">{formatCurrency(ca3.tva_deductible.total, 'EUR')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <span className="font-semibold">
                {ca3.tva_a_payer >= 0 ? t('tvaAPayer') : 'Crédit de TVA'}
              </span>
              <span className={`text-xl font-bold ${ca3.tva_a_payer >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                {formatCurrency(Math.abs(ca3.tva_a_payer), 'EUR')}
              </span>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            ⚠️ Ce résumé est fourni à titre indicatif. Vérifiez et validez votre CA3 sur impots.gouv.fr. Consultez votre expert-comptable.
          </div>
        </div>
      ) : null}

      {/* FEC info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-2">FEC — Fichier des Écritures Comptables</h2>
        <p className="text-sm text-slate-600">
          L'export FEC est généré au format DGFiP (délimiteur |) conforme aux exigences de la Direction Générale des Finances Publiques.
          Il inclut toutes les transactions françaises de l'année {year} avec les écritures TVA correspondantes.
        </p>
        <button
          onClick={downloadFec}
          disabled={downloadingFec}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          <Download size={16} />
          {downloadingFec ? t('loading') : `Télécharger FEC ${year}`}
        </button>
      </div>
    </div>
  )
}

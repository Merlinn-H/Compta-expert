import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, formatCurrency } from '../utils/api'
import { useT } from '../hooks/useT'

interface QuarterlyData {
  year: number
  quarter: number
  period: string
  tps: { collected: number; cti_recoverable: number; net_remittance: number; label: string }
  tvq: { collected: number; rti_recoverable: number; net_remittance: number; label: string }
  total_remittance: number
  transaction_count: number
}

interface PayrollData {
  year: number
  total_income_cad: number
  transaction_count: number
  note: string
}

export default function TaxQuebecPage() {
  const t = useT()
  const [year, setYear] = useState(new Date().getFullYear())
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3))

  const { data: quarterly, isLoading: loadingQ } = useQuery({
    queryKey: ['tax', 'quebec', 'quarterly', year, quarter],
    queryFn: async () => {
      const res = await api.get<QuarterlyData>('/tax/quebec/quarterly', {
        params: { year, quarter },
      })
      return res.data
    },
  })

  const { data: payroll } = useQuery({
    queryKey: ['tax', 'quebec', 'payroll', year],
    queryFn: async () => {
      const res = await api.get<PayrollData>('/tax/quebec/payroll', { params: { year } })
      return res.data
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🍁</span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('taxQuebec')}</h1>
          <p className="text-slate-500 text-sm">TPS (5%) • TVQ (9.975%) • CTI/RTI</p>
        </div>
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
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('quarter')}</label>
          <select
            value={quarter}
            onChange={(e) => setQuarter(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value={1}>T1 (Jan–Mar)</option>
            <option value={2}>T2 (Avr–Jun)</option>
            <option value={3}>T3 (Jul–Sep)</option>
            <option value={4}>T4 (Oct–Déc)</option>
          </select>
        </div>
      </div>

      {loadingQ ? (
        <div className="text-slate-400">{t('loading')}</div>
      ) : quarterly ? (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-800">
                {t('taxSummary')} — T{quarterly.quarter} {quarterly.year}
              </h2>
              <p className="text-xs text-slate-500">{quarterly.period} • {quarterly.transaction_count} transactions</p>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* TPS Card */}
              <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
                <h3 className="font-semibold text-blue-800 mb-3">{quarterly.tps.label}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">{t('tpsCollected')}</span>
                    <span className="font-medium text-blue-900">{formatCurrency(quarterly.tps.collected, 'CAD')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">{t('ctiRecoverable')}</span>
                    <span className="font-medium text-green-700">−{formatCurrency(quarterly.tps.cti_recoverable, 'CAD')}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-2 font-semibold">
                    <span className="text-blue-800">{t('netRemittance')}</span>
                    <span className={quarterly.tps.net_remittance >= 0 ? 'text-red-700' : 'text-green-700'}>
                      {formatCurrency(Math.abs(quarterly.tps.net_remittance), 'CAD')}
                      {quarterly.tps.net_remittance < 0 && ' (crédit)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* TVQ Card */}
              <div className="border border-purple-200 rounded-xl p-4 bg-purple-50">
                <h3 className="font-semibold text-purple-800 mb-3">{quarterly.tvq.label}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-700">{t('tvqCollected')}</span>
                    <span className="font-medium text-purple-900">{formatCurrency(quarterly.tvq.collected, 'CAD')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">{t('rtiRecoverable')}</span>
                    <span className="font-medium text-green-700">−{formatCurrency(quarterly.tvq.rti_recoverable, 'CAD')}</span>
                  </div>
                  <div className="flex justify-between border-t border-purple-200 pt-2 font-semibold">
                    <span className="text-purple-800">{t('netRemittance')}</span>
                    <span className={quarterly.tvq.net_remittance >= 0 ? 'text-red-700' : 'text-green-700'}>
                      {formatCurrency(Math.abs(quarterly.tvq.net_remittance), 'CAD')}
                      {quarterly.tvq.net_remittance < 0 && ' (crédit)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <span className="font-semibold">Versement total</span>
              <span className={`text-xl font-bold ${quarterly.total_remittance >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                {formatCurrency(Math.abs(quarterly.total_remittance), 'CAD')}
                {quarterly.total_remittance < 0 && ' (crédit global)'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            ⚠️ Ce résumé est fourni à titre indicatif. Consultez un comptable agréé (CPA) pour vos remises officielles à l'ARC et à Revenu Québec.
          </div>
        </div>
      ) : null}

      {/* RL-1 / T4 section */}
      {payroll && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">RL-1 / T4 — {year}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Revenus totaux (CAD)</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(payroll.total_income_cad, 'CAD')}</p>
            </div>
            <div>
              <p className="text-slate-500">Transactions de revenus</p>
              <p className="text-xl font-bold text-slate-900">{payroll.transaction_count}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 p-3 bg-slate-50 rounded">{payroll.note}</p>
        </div>
      )}
    </div>
  )
}

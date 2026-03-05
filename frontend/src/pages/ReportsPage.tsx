import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText } from 'lucide-react'
import { api, formatCurrency } from '../utils/api'
import { useT } from '../hooks/useT'
import { useAppStore } from '../store/useAppStore'

interface PnLLine {
  id: number
  date: string
  description: string
  jurisdiction: string
  original_amount: number
  original_currency: string
  converted_amount: number | null
  target_currency: string | null
  exchange_rate: number | null
  rate_label: string | null
}

interface PnLData {
  period: { from: string; to: string }
  jurisdiction: string
  income: { lines: PnLLine[]; total: number }
  expenses: { lines: PnLLine[]; total: number }
  net: number
}

export default function ReportsPage() {
  const t = useT()
  const { language } = useAppStore()
  const currentYear = new Date().getFullYear()
  const [dateFrom, setDateFrom] = useState(`${currentYear}-01-01`)
  const [dateTo, setDateTo] = useState(`${currentYear}-12-31`)
  const [jurisdiction, setJurisdiction] = useState('')
  const [generated, setGenerated] = useState(false)

  const { data: pnl, isLoading, refetch } = useQuery({
    queryKey: ['reports', 'pnl', dateFrom, dateTo, jurisdiction],
    queryFn: async () => {
      const params: Record<string, string> = { date_from: dateFrom, date_to: dateTo }
      if (jurisdiction) params.jurisdiction = jurisdiction
      const res = await api.get<PnLData>('/reports/pnl', { params })
      return res.data
    },
    enabled: generated,
  })

  const downloadPdf = async () => {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
      language,
      ...(jurisdiction ? { jurisdiction } : {}),
    })
    const res = await api.get(`/reports/pnl/pdf?${params}`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `PnL_${dateFrom}_${dateTo}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadCsv = async () => {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
      ...(jurisdiction ? { jurisdiction } : {}),
    })
    const res = await api.get(`/reports/transactions/csv?${params}`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${dateFrom}_${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('reports')}</h1>
        <p className="text-slate-500 text-sm">Compte de résultat • Export PDF / CSV</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-4">{t('profitLoss')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('dateFrom')}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('dateTo')}</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('jurisdiction')}</label>
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{t('all')}</option>
              <option value="quebec">🍁 {t('quebec')}</option>
              <option value="france">🇫🇷 {t('france')}</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setGenerated(true); refetch() }}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              {t('generate')}
            </button>
          </div>
        </div>

        {/* Export buttons */}
        {pnl && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={downloadPdf}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <FileText size={16} />
              {t('downloadPDF')}
            </button>
            <button
              onClick={downloadCsv}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Download size={16} />
              {t('downloadCSV')}
            </button>
          </div>
        )}
      </div>

      {/* P&L Results */}
      {isLoading && <div className="text-slate-400">{t('loading')}</div>}

      {pnl && (
        <div className="space-y-4">
          {/* Net result banner */}
          <div className={`p-4 rounded-xl flex justify-between items-center ${
            pnl.net >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div>
              <p className="text-sm text-slate-600">{t('net')} — {pnl.period.from} → {pnl.period.to}</p>
              <p className="text-xs text-slate-400">{pnl.transaction_count} transactions</p>
            </div>
            <span className={`text-3xl font-bold ${pnl.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {pnl.net >= 0 ? '+' : ''}{pnl.net.toFixed(2)}
            </span>
          </div>

          {/* Income table */}
          <PnLTable
            title={`${t('totalIncome')} — ${formatCurrency(pnl.income.total, 'CAD')}`}
            lines={pnl.income.lines}
            total={pnl.income.total}
            isIncome={true}
            t={t}
          />

          {/* Expenses table */}
          <PnLTable
            title={`${t('totalExpenses')} — ${formatCurrency(pnl.expenses.total, 'CAD')}`}
            lines={pnl.expenses.lines}
            total={pnl.expenses.total}
            isIncome={false}
            t={t}
          />

          <p className="text-xs text-slate-400 italic">
            * Les taux de change affichés sont les taux historiques à la date de chaque transaction.
            Ces taux sont stockés définitivement et ne sont jamais recalculés.
          </p>
        </div>
      )}
    </div>
  )
}

function PnLTable({
  title,
  lines,
  total,
  isIncome,
  t,
}: {
  title: string
  lines: PnLLine[]
  total: number
  isIncome: boolean
  t: (k: string) => string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className={`p-4 border-b ${isIncome ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <h3 className={`font-semibold ${isIncome ? 'text-green-800' : 'text-red-800'}`}>{title}</h3>
      </div>

      {lines.length === 0 ? (
        <div className="p-4 text-slate-400 text-sm text-center">—</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                <th className="text-left px-4 py-2">{t('date')}</th>
                <th className="text-left px-4 py-2">{t('description')}</th>
                <th className="text-right px-4 py-2">{t('originalAmount')}</th>
                <th className="text-right px-4 py-2">{t('targetAmount')}</th>
                <th className="text-left px-4 py-2">{t('rateUsed')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line) => (
                <tr key={line.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-500">{line.date}</td>
                  <td className="px-4 py-2">
                    <span className="font-medium text-slate-800">{line.description}</span>
                    <span className="ml-2 text-xs">{line.jurisdiction === 'quebec' ? '🍁' : '🇫🇷'}</span>
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {line.original_amount.toFixed(2)} {line.original_currency}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-500">
                    {line.converted_amount != null && line.target_currency
                      ? `${line.converted_amount.toFixed(2)} ${line.target_currency}`
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-xs text-amber-600">
                    {line.rate_label || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={`font-bold ${isIncome ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <td colSpan={2} className="px-4 py-2">{t('total')}</td>
                <td className="px-4 py-2 text-right">{total.toFixed(2)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

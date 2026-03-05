import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, Scale, Clock } from 'lucide-react'
import { api, formatCurrency, formatDate } from '../utils/api'
import { useAppStore } from '../store/useAppStore'
import { useT } from '../hooks/useT'
import SummaryCard from '../components/SummaryCard'
import AmountDisplay from '../components/AmountDisplay'
import type { DashboardData, Transaction } from '../types'

export default function DashboardPage() {
  const t = useT()
  const { displayCurrency, setDisplayCurrency, jurisdiction } = useAppStore()
  const [year, setYear] = useState(new Date().getFullYear())

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', year],
    queryFn: async () => {
      const res = await api.get<DashboardData>('/dashboard/', { params: { year } })
      return res.data
    },
  })

  if (isLoading || !data) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-slate-400">{t('loading')}</div>
      </div>
    )
  }

  const source =
    jurisdiction === 'quebec'
      ? data.quebec
      : jurisdiction === 'france'
      ? data.france
      : null

  const incomeCAD = source ? source.total_income_cad : data.combined.total_income_cad
  const expensesCAD = source ? source.total_expenses_cad : data.combined.total_expenses_cad
  const netCAD = source ? source.net_balance_cad : data.combined.net_cad
  const incomeEUR = source ? source.total_income_eur : data.combined.total_income_eur
  const expensesEUR = source ? source.total_expenses_eur : data.combined.total_expenses_eur
  const netEUR = source ? source.net_balance_eur : data.combined.net_eur

  const chartData = data.monthly_trend.map((d) => ({
    month: d.month,
    Revenus: Math.round(d.income),
    Dépenses: Math.round(d.expenses),
    Net: Math.round(d.net),
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('dashboard')}</h1>
          <p className="text-slate-500 text-sm">
            {jurisdiction === 'all' ? t('allJurisdictions') : jurisdiction === 'quebec' ? '🍁 Québec' : '🇫🇷 France'}
            {' — '}{year}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Year selector */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"
          >
            {[2022, 2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Currency toggle */}
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            {(['CAD', 'EUR', 'both'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setDisplayCurrency(c)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  displayCurrency === c
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {c === 'both' ? 'CAD + EUR' : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title={t('totalIncome')}
          amountCAD={incomeCAD}
          amountEUR={incomeEUR}
          displayCurrency={displayCurrency}
          variant="income"
          icon={<TrendingUp size={20} />}
        />
        <SummaryCard
          title={t('totalExpenses')}
          amountCAD={expensesCAD}
          amountEUR={expensesEUR}
          displayCurrency={displayCurrency}
          variant="expense"
          icon={<TrendingDown size={20} />}
        />
        <SummaryCard
          title={t('netBalance')}
          amountCAD={netCAD}
          amountEUR={netEUR}
          displayCurrency={displayCurrency}
          variant="net"
          icon={<Scale size={20} />}
        />
      </div>

      {/* Jurisdiction breakdown (when showing all) */}
      {jurisdiction === 'all' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">🍁 Québec</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('totalIncome')}</span>
                <span className="text-green-600 font-medium">{formatCurrency(data.quebec.total_income_cad, 'CAD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('totalExpenses')}</span>
                <span className="text-red-600 font-medium">{formatCurrency(data.quebec.total_expenses_cad, 'CAD')}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium text-slate-700">{t('netBalance')}</span>
                <span className={`font-bold ${data.quebec.net_balance_cad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.quebec.net_balance_cad, 'CAD')}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">🇫🇷 France</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('totalIncome')}</span>
                <span className="text-green-600 font-medium">{formatCurrency(data.france.total_income_eur, 'EUR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('totalExpenses')}</span>
                <span className="text-red-600 font-medium">{formatCurrency(data.france.total_expenses_eur, 'EUR')}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium text-slate-700">{t('netBalance')}</span>
                <span className={`font-bold ${data.france.net_balance_eur >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.france.net_balance_eur, 'EUR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly trend chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">{t('monthlyTrend')}</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => value.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              />
              <Legend />
              <Area type="monotone" dataKey="Revenus" stroke="#16a34a" fill="#dcfce7" strokeWidth={2} />
              <Area type="monotone" dataKey="Dépenses" stroke="#dc2626" fill="#fee2e2" strokeWidth={2} />
              <Area type="monotone" dataKey="Net" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent transactions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Clock size={18} />
          {t('recentTransactions')}
        </h2>
        {data.recent_transactions.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">{t('noTransactions')}</p>
        ) : (
          <div className="space-y-3">
            {(data.recent_transactions as Transaction[]).map((t_) => (
              <div
                key={t_.id}
                className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{t_.description}</p>
                  <p className="text-xs text-slate-400">
                    {t_.date} • {t_.jurisdiction === 'quebec' ? '🍁' : '🇫🇷'}{' '}
                    {t_.category?.name_fr || t_.category?.name || '—'}
                  </p>
                </div>
                <AmountDisplay transaction={t_} showRate={false} className="text-right ml-4" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

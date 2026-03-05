import { formatCurrency } from '../utils/api'
import type { Currency } from '../types'

interface SummaryCardProps {
  title: string
  amountCAD: number
  amountEUR: number
  displayCurrency: Currency | 'both'
  variant?: 'income' | 'expense' | 'net'
  icon?: React.ReactNode
  subtitle?: string
}

export default function SummaryCard({
  title,
  amountCAD,
  amountEUR,
  displayCurrency,
  variant = 'net',
  icon,
  subtitle,
}: SummaryCardProps) {
  const colorMap = {
    income: 'text-green-600',
    expense: 'text-red-600',
    net: amountCAD >= 0 ? 'text-green-600' : 'text-red-600',
  }

  const bgMap = {
    income: 'bg-green-50 border-green-200',
    expense: 'bg-red-50 border-red-200',
    net: amountCAD >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200',
  }

  return (
    <div className={`rounded-xl border p-5 ${bgMap[variant]}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      {(displayCurrency === 'CAD' || displayCurrency === 'both') && (
        <p className={`text-2xl font-bold ${colorMap[variant]}`}>
          {formatCurrency(amountCAD, 'CAD')}
        </p>
      )}

      {displayCurrency === 'both' && (
        <p className={`text-sm font-medium mt-1 ${colorMap[variant]} opacity-75`}>
          {formatCurrency(amountEUR, 'EUR')}
        </p>
      )}

      {displayCurrency === 'EUR' && (
        <p className={`text-2xl font-bold ${colorMap[variant]}`}>
          {formatCurrency(amountEUR, 'EUR')}
        </p>
      )}

      {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
    </div>
  )
}

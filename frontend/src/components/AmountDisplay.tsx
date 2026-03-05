/**
 * Displays an amount with its currency, and optionally its converted amount
 * and the historical exchange rate used. The rate label is always shown
 * when a conversion exists — never silently recalculated.
 */
import { useT } from '../hooks/useT'
import { formatCurrency } from '../utils/api'
import type { Transaction } from '../types'

interface AmountDisplayProps {
  transaction: Transaction
  showRate?: boolean
  className?: string
}

export default function AmountDisplay({ transaction, showRate = true, className = '' }: AmountDisplayProps) {
  const t = useT()
  const { amount, currency, converted_amount, target_currency, exchange_rate_at_date, date, type } = transaction

  const amountColor = type === 'income' ? 'text-green-600' : 'text-red-600'

  return (
    <div className={className}>
      <span className={`font-semibold ${amountColor}`}>
        {type === 'expense' ? '−' : '+'}{formatCurrency(amount, currency)}
      </span>

      {converted_amount != null && target_currency && (
        <span className="text-slate-500 text-sm ml-2">
          ≈ {formatCurrency(converted_amount, target_currency)}
        </span>
      )}

      {showRate && exchange_rate_at_date != null && target_currency && (
        <p className="text-xs text-slate-400 mt-0.5">
          1 {currency} = {exchange_rate_at_date.toFixed(4)} {target_currency} — {t('rateAsOf')} {date}
        </p>
      )}
    </div>
  )
}

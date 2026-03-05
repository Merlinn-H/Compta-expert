import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { api, formatDate } from '../utils/api'
import { useAppStore } from '../store/useAppStore'
import { useT } from '../hooks/useT'
import TransactionForm from '../components/TransactionForm'
import AmountDisplay from '../components/AmountDisplay'
import type { Transaction, TransactionCreate } from '../types'

export default function TransactionsPage() {
  const t = useT()
  const queryClient = useQueryClient()
  const { jurisdiction } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [filterType, setFilterType] = useState<string>('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', jurisdiction, filterType],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (jurisdiction !== 'all') params.jurisdiction = jurisdiction
      if (filterType) params.type = filterType
      const res = await api.get<Transaction[]>('/transactions/', { params })
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: TransactionCreate) => {
      const res = await api.post<Transaction>('/transactions/', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/transactions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const handleDelete = async (tx: Transaction) => {
    if (confirm(t('deleteConfirm'))) {
      await deleteMutation.mutateAsync(tx.id)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('transactions')}</h1>
          <p className="text-slate-500 text-sm">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setEditingTx(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} />
          {t('newTransaction')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { value: '', label: t('all') },
          { value: 'income', label: t('income') },
          { value: 'expense', label: t('expense') },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterType(value)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              filterType === value
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Transactions list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">{t('loading')}</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400">{t('noTransactions')}</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-emerald-600 text-sm hover:underline"
            >
              {t('newTransaction')} →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
              <div className="col-span-2">{t('date')}</div>
              <div className="col-span-4">{t('description')}</div>
              <div className="col-span-2">{t('amount')}</div>
              <div className="col-span-2">{t('convertedAmount')}</div>
              <div className="col-span-1">Jur.</div>
              <div className="col-span-1"></div>
            </div>

            {transactions.map((tx) => (
              <div key={tx.id}>
                <div
                  className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                >
                  <div className="col-span-2 text-sm text-slate-600">{tx.date}</div>
                  <div className="col-span-4">
                    <p className="text-sm font-medium text-slate-800 truncate">{tx.description}</p>
                    {tx.category && (
                      <p className="text-xs text-slate-400">{tx.category.name_fr || tx.category.name}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'expense' ? '−' : '+'}{tx.amount.toFixed(2)} {tx.currency}
                    </span>
                  </div>
                  <div className="col-span-2">
                    {tx.converted_amount != null && tx.target_currency ? (
                      <span className="text-xs text-slate-500">
                        ≈ {tx.converted_amount.toFixed(2)} {tx.target_currency}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </div>
                  <div className="col-span-1">
                    <span className="text-sm">{tx.jurisdiction === 'quebec' ? '🍁' : '🇫🇷'}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingTx(tx); setShowForm(true) }}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(tx) }}
                      className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded row: rate info */}
                {expandedId === tx.id && (
                  <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-4 text-xs mt-2">
                      {tx.exchange_rate_at_date != null && tx.target_currency && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="font-semibold text-amber-800 mb-1">💱 {t('historicalRate')}</p>
                          <p className="text-amber-700">
                            1 {tx.currency} = {tx.exchange_rate_at_date.toFixed(6)} {tx.target_currency}
                          </p>
                          <p className="text-amber-600 mt-0.5">{t('rateAsOf')} {tx.date}</p>
                        </div>
                      )}
                      {tx.tax_entries.length > 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="font-semibold text-blue-800 mb-1">Taxes</p>
                          {tx.tax_entries.map((te) => (
                            <p key={te.id} className="text-blue-700">
                              {te.tax_type} {te.rate}% = {te.amount.toFixed(2)} {tx.currency}
                              {te.recoverable && ' (récupérable)'}
                            </p>
                          ))}
                        </div>
                      )}
                      {tx.notes && (
                        <div className="col-span-2 p-2 bg-white border border-slate-200 rounded text-slate-600">
                          {tx.notes}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction form modal */}
      {showForm && (
        <TransactionForm
          onClose={() => { setShowForm(false); setEditingTx(null) }}
          onSave={async (data) => {
            if (editingTx) {
              await api.put(`/transactions/${editingTx.id}`, data)
              queryClient.invalidateQueries({ queryKey: ['transactions'] })
              queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            } else {
              await createMutation.mutateAsync(data)
            }
          }}
          initial={editingTx ? {
            date: editingTx.date,
            description: editingTx.description,
            amount: editingTx.amount,
            currency: editingTx.currency,
            jurisdiction: editingTx.jurisdiction,
            type: editingTx.type,
            category_id: editingTx.category_id ?? undefined,
            notes: editingTx.notes ?? '',
          } : undefined}
          isEditing={!!editingTx}
        />
      )}
    </div>
  )
}

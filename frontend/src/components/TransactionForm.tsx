import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { X, Plus, Trash2 } from 'lucide-react'
import { api } from '../utils/api'
import { useT } from '../hooks/useT'
import type { Category, TransactionCreate, TaxType, Jurisdiction, Currency, TransactionType } from '../types'

interface Props {
  onClose: () => void
  onSave: (data: TransactionCreate) => Promise<void>
  initial?: Partial<TransactionCreate>
  isEditing?: boolean
}

interface TaxEntryForm {
  tax_type: TaxType
  rate: number
  amount: number
  recoverable: boolean
}

export default function TransactionForm({ onClose, onSave, initial, isEditing }: Props) {
  const t = useT()
  const [taxEntries, setTaxEntries] = useState<TaxEntryForm[]>(
    (initial?.tax_entries as TaxEntryForm[]) || []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, watch, setValue } = useForm<TransactionCreate>({
    defaultValues: {
      date: initial?.date || new Date().toISOString().split('T')[0],
      description: initial?.description || '',
      amount: initial?.amount || 0,
      currency: initial?.currency || 'CAD',
      jurisdiction: initial?.jurisdiction || 'quebec',
      type: initial?.type || 'expense',
      category_id: initial?.category_id,
      notes: initial?.notes || '',
    },
  })

  const jurisdiction = watch('jurisdiction') as Jurisdiction
  const currency = watch('currency') as Currency
  const amount = watch('amount')

  const { data: categories } = useQuery({
    queryKey: ['categories', jurisdiction],
    queryFn: async () => {
      const res = await api.get<Category[]>('/categories/', {
        params: { jurisdiction },
      })
      return res.data
    },
  })

  const addTaxEntry = (taxType: TaxType, rate: number) => {
    const taxAmount = (Number(amount) * rate) / 100
    setTaxEntries((prev) => [
      ...prev,
      {
        tax_type: taxType,
        rate,
        amount: Math.round(taxAmount * 100) / 100,
        recoverable: false,
      },
    ])
  }

  const removeTaxEntry = (idx: number) => {
    setTaxEntries((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateTaxEntry = (idx: number, field: keyof TaxEntryForm, value: unknown) => {
    setTaxEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e))
    )
  }

  const onSubmit = async (data: TransactionCreate) => {
    setSaving(true)
    setError('')
    try {
      await onSave({ ...data, tax_entries: taxEntries })
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const quickTaxButtons =
    jurisdiction === 'quebec'
      ? [
          { label: 'TPS 5%', type: 'TPS' as TaxType, rate: 5 },
          { label: 'TVQ 9.975%', type: 'TVQ' as TaxType, rate: 9.975 },
        ]
      : [
          { label: 'TVA 20%', type: 'TVA' as TaxType, rate: 20 },
          { label: 'TVA 10%', type: 'TVA' as TaxType, rate: 10 },
          { label: 'TVA 5.5%', type: 'TVA' as TaxType, rate: 5.5 },
        ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-slate-900">
            {isEditing ? t('editTransaction') : t('newTransaction')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('date')}</label>
              <input
                type="date"
                {...register('date', { required: true })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('type')}</label>
              <select
                {...register('type')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="income">{t('income')}</option>
                <option value="expense">{t('expense')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('description')}</label>
            <input
              type="text"
              {...register('description', { required: true })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder={t('description')}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('amount')}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('amount', { required: true, valueAsNumber: true })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('currency')}</label>
              <select
                {...register('currency')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="CAD">CAD 🇨🇦</option>
                <option value="EUR">EUR 🇪🇺</option>
                <option value="USD">USD 🇺🇸</option>
                <option value="GBP">GBP 🇬🇧</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('jurisdiction')}</label>
              <select
                {...register('jurisdiction')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="quebec">🍁 {t('quebec')}</option>
                <option value="france">🇫🇷 {t('france')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('category')}</label>
              <select
                {...register('category_id', { valueAsNumber: true })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">—</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_fr || cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('notes')}</label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Tax entries */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Taxes</label>
              <div className="flex gap-2">
                {quickTaxButtons.map(({ label, type, rate }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => addTaxEntry(type, rate)}
                    className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    + {label}
                  </button>
                ))}
              </div>
            </div>

            {taxEntries.length > 0 && (
              <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
                {taxEntries.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <span className="font-medium w-20">{entry.tax_type} {entry.rate}%</span>
                    <input
                      type="number"
                      step="0.01"
                      value={entry.amount}
                      onChange={(e) => updateTaxEntry(idx, 'amount', parseFloat(e.target.value))}
                      className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm"
                    />
                    <label className="flex items-center gap-1 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={entry.recoverable}
                        onChange={(e) => updateTaxEntry(idx, 'recoverable', e.target.checked)}
                      />
                      CTI/RTI
                    </label>
                    <button
                      type="button"
                      onClick={() => removeTaxEntry(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            💱 {jurisdiction === 'quebec'
              ? `Le taux de change historique CAD→EUR sera automatiquement récupéré pour le ${watch('date')} et stocké de façon permanente.`
              : `Le taux de change historique EUR→CAD sera automatiquement récupéré pour le ${watch('date')} et stocké de façon permanente.`}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {saving ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

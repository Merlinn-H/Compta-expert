export type Language = 'fr' | 'en'
export type Currency = 'CAD' | 'EUR' | 'USD' | 'GBP'
export type Jurisdiction = 'quebec' | 'france'
export type TransactionType = 'income' | 'expense'
export type TaxType = 'TPS' | 'TVQ' | 'TVA'

export interface User {
  id: number
  email: string
  full_name: string | null
  preferred_language: Language
  default_currency: Currency
  fiscal_year_start: number
  created_at: string
}

export interface Category {
  id: number
  name: string
  name_fr: string | null
  type: TransactionType
  jurisdiction: string
}

export interface TaxEntry {
  id: number
  tax_type: TaxType
  rate: number
  amount: number
  recoverable: boolean
}

export interface Transaction {
  id: number
  user_id: number
  date: string
  description: string
  notes: string | null
  amount: number
  currency: Currency
  target_currency: Currency | null
  exchange_rate_at_date: number | null
  converted_amount: number | null
  jurisdiction: Jurisdiction
  type: TransactionType
  category_id: number | null
  category: Category | null
  tax_entries: TaxEntry[]
  created_at: string
  updated_at: string
}

export interface TransactionCreate {
  date: string
  description: string
  notes?: string
  amount: number
  currency: Currency
  target_currency?: Currency
  jurisdiction: Jurisdiction
  type: TransactionType
  category_id?: number
  tax_entries?: {
    tax_type: TaxType
    rate: number
    amount: number
    recoverable: boolean
  }[]
}

export interface JurisdictionSummary {
  total_income_original: number
  total_expenses_original: number
  net_balance_original: number
  currency: Currency
  total_income_cad: number
  total_expenses_cad: number
  net_balance_cad: number
  total_income_eur: number
  total_expenses_eur: number
  net_balance_eur: number
}

export interface MonthlyDataPoint {
  month: string
  income: number
  expenses: number
  net: number
  currency: string
}

export interface DashboardData {
  quebec: JurisdictionSummary
  france: JurisdictionSummary
  combined: {
    total_income_cad: number
    total_expenses_cad: number
    net_cad: number
    total_income_eur: number
    total_expenses_eur: number
    net_eur: number
  }
  monthly_trend: MonthlyDataPoint[]
  recent_transactions: Transaction[]
}

export interface AuthToken {
  access_token: string
  token_type: string
  user: User
}

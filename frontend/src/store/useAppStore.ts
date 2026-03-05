import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language, Currency, User } from '../types'

interface AppState {
  // Auth
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void

  // UI preferences
  language: Language
  setLanguage: (lang: Language) => void
  displayCurrency: Currency | 'both'
  setDisplayCurrency: (currency: Currency | 'both') => void
  jurisdiction: 'all' | 'quebec' | 'france'
  setJurisdiction: (j: 'all' | 'quebec' | 'france') => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),

      language: 'fr',
      setLanguage: (language) => set({ language }),

      displayCurrency: 'both',
      setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),

      jurisdiction: 'all',
      setJurisdiction: (jurisdiction) => set({ jurisdiction }),
    }),
    {
      name: 'compta-expert-store',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        language: state.language,
        displayCurrency: state.displayCurrency,
        jurisdiction: state.jurisdiction,
      }),
    }
  )
)

import { useAppStore } from '../store/useAppStore'
import { translations, type TranslationKey } from '../i18n/translations'

export function useT() {
  const language = useAppStore((s) => s.language)
  return (key: TranslationKey): string => translations[language][key] ?? key
}

import { enGB, fr as frLocale } from 'date-fns/locale'
import { useSettings } from '@/store/settings'
import { en, type Messages } from './en'
import { fr } from './fr'
import type { Lang } from './detect'

export { detectLang, type Lang } from './detect'
export type { Messages }

export const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
]

const MESSAGES: Record<Lang, Messages> = { en, fr }
const DATE_LOCALES = { en: enGB, fr: frLocale }

export const messages = (lang: Lang): Messages => MESSAGES[lang] ?? en
export const dateLocale = (lang: Lang) => DATE_LOCALES[lang] ?? enGB

export function useT(): Messages {
  return messages(useSettings((s) => s.lang))
}

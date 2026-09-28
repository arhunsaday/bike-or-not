export type Lang = 'en' | 'fr'

/** French if the browser's preferred language is French, English otherwise. */
export function detectLang(): Lang {
  const preferred = typeof navigator === 'undefined'
    ? ''
    : navigator.languages?.[0] ?? navigator.language ?? ''
  return preferred.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

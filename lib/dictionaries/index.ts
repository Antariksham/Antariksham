// Dictionary lookup for UI strings.
//
// Usage — server or client, no async, no provider:
//
//     import { translator } from '@/lib/dictionaries'
//     const t = translator(lang)
//     <h1>{t('nav.articles')}</h1>
//
// The key set is enforced at COMPILE time by `Dictionary` (see en.ts), so a
// missing translation cannot reach a reader. The `|| en[key]` below is the
// second net, for a key that type-checks but was left as an empty string: a
// reader sees English, never a blank label.

import { en, type Dictionary, type DictionaryKey } from './en'
import { hi } from './hi'
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/lib/i18n'

const DICTIONARIES: Record<LanguageCode, Dictionary> = { en, hi }

/** A bound lookup for one language. */
export type Translate = (key: DictionaryKey) => string

/** The whole dictionary for a language, falling back to English if unknown. */
export function getDictionary(lang: LanguageCode): Dictionary {
  return DICTIONARIES[lang] ?? DICTIONARIES[DEFAULT_LANGUAGE]
}

/**
 * Build the `t()` lookup for a language. Falls back to the English string for
 * any key whose translation is present but empty.
 */
export function translator(lang: LanguageCode): Translate {
  const dict = getDictionary(lang)
  return (key: DictionaryKey) => dict[key] || en[key]
}

export type { Dictionary, DictionaryKey }
export { en, hi }

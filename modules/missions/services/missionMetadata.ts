import type { Metadata } from 'next'
import { localizedAlternates, type LanguageCode } from '@/lib/i18n'
import type { Mission } from '@/types/mission'

// hreflang/canonical-aware metadata for a mission. A language URL serving
// English fallback is canonical → EN + noindex.
export function buildMissionMetadata(mission: Mission, lang: LanguageCode): Metadata {
  const { isFallback, canonical, languages } = localizedAlternates(
    'missions', mission.slug, mission.availableLanguages, mission.language, lang,
  )
  // Prefer the concise mission summary for the meta/OG description (Feature 1);
  // fall back to the full description for missions that predate it.
  const description = mission.identity?.summary?.trim() || mission.description
  return {
    title:       mission.name,
    description,
    alternates:  { canonical, languages },
    ...(isFallback ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title:       mission.name,
      description,
      images:      mission.featuredImage ? [mission.featuredImage] : [],
      locale:      lang === 'hi' ? 'hi_IN' : 'en_US',
    },
  }
}

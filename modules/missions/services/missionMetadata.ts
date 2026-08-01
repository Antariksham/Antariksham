import type { Metadata } from 'next'
import { localizedAlternates, type LanguageCode } from '@/lib/i18n'
import { buildPageMetadata } from '@/modules/seo/pageMetadata'
import { ogCardPath } from '@/modules/seo/socialMeta'
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

  return buildPageMetadata({
    path:        canonical,
    canonical,
    languages,
    noindex:     isFallback,
    title:       mission.name,
    description,
    // As with articles: the hero image when the mission has one, otherwise a
    // generated card. `images: []` used to leave these shares with no card.
    image:       mission.featuredImage,
    imageAlt:    mission.name,
    fallbackImagePath: ogCardPath({ title: mission.name, eyebrow: 'Mission' }),
    locale:      lang === 'hi' ? 'hi_IN' : 'en_US',
  })
}

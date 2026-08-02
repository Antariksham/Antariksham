import type { Metadata } from 'next'
import { buildPageMetadata } from '@/modules/seo/pageMetadata'
import { getMissions, getFeaturedMissions } from '@/modules/missions/services/getMissions'
import { MissionsPage } from '@/modules/missions/components/MissionsPage'

const LANG = 'hi' as const

export const revalidate = 600

export const metadata: Metadata = buildPageMetadata({
  path:        '/hi/missions',
  title:       'अंतरिक्ष मिशन',
  description: 'नासा, इसरो, स्पेसएक्स, ईएसए और सभी प्रमुख एजेंसियों के सक्रिय, आगामी और ऐतिहासिक अंतरिक्ष मिशन — एक ही जगह।',
  locale:      'hi_IN',
  languages: {
    en:          '/missions',
    hi:          '/hi/missions',
    'x-default': '/missions',
  },
  // No fallbackImagePath — see /hi/articles: the generated card's bundled font
  // is Latin-only, so a Devanagari headline would rasterise as empty boxes.
})

export default async function HindiMissionsRoute() {
  const [{ missions, total }, featured] = await Promise.all([
    getMissions({ page: 1, perPage: 12, lang: LANG }),
    getFeaturedMissions(4, LANG),
  ])

  return (
    <MissionsPage
      missions={missions}
      featured={featured}
      total={total}
      lang={LANG}
    />
  )
}

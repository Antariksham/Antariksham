import type { Metadata }     from 'next'
import { buildPageMetadata } from '@/modules/seo/pageMetadata'
import { HomePage }          from '@/modules/homepage/components/HomePage'
import { getLatestArticles } from '@/modules/articles/services/getArticles'
import { getActiveMissions } from '@/modules/missions/services/getMissions'

const LANG = 'hi' as const

export const metadata: Metadata = buildPageMetadata({
  path:        '/hi',
  title:       'अंतरिक्षम् — अंतरिक्ष बुद्धिमत्ता और ज्ञान मंच',
  description: 'वैज्ञानिक पत्रकारिता, लाइव मिशन ट्रैकिंग, गहन-अंतरिक्ष टेलीमेट्री और एक शैक्षिक ज्ञान इंजन — सब एक स्वतंत्र मंच पर।',
  locale:      'hi_IN',
  languages: {
    en:          '/',
    hi:          '/hi',
    'x-default': '/',
  },
  // No fallbackImagePath — see /hi/articles: the generated card's bundled font
  // is Latin-only, so a Devanagari headline would rasterise as empty boxes.
})

export const revalidate = 300

// No WebSite/Organization JSON-LD here: both describe the site as a whole and
// are declared once, on the English home page at the canonical root. Repeating
// them per language would assert two sites rather than one site in two
// languages — the hreflang pair above is what ties these homepages together.
export default async function HindiHomeRoute() {
  const [articles, missions] = await Promise.all([
    getLatestArticles(6, LANG),
    // 6 fills the desktop grid (3 columns × 2 rows); mobile hides the last 2 (see responsive.css)
    getActiveMissions(6, LANG),
  ])

  return <HomePage articles={articles} missions={missions} lang={LANG} />
}

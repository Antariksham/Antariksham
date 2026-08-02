import type { Metadata }        from 'next'
import { buildPageMetadata }    from '@/modules/seo/pageMetadata'
import { getKnowledgeArticles } from '@/modules/learn/services/getKnowledgeArticles'
import { LearnPage }            from '@/modules/learn/components/LearnPage'

const LANG = 'hi' as const

export const revalidate = 300

export const metadata: Metadata = buildPageMetadata({
  path:        '/hi/learn',
  title:       'सीखें',
  description: 'कक्षीय यांत्रिकी, खगोल भौतिकी, ब्लैक होल, सापेक्षता और अंतरिक्ष अन्वेषण के पीछे के गणित पर विस्तृत लेख।',
  locale:      'hi_IN',
  languages: {
    en:          '/learn',
    hi:          '/hi/learn',
    'x-default': '/learn',
  },
  // No fallbackImagePath — see /hi/articles: the generated card's bundled font
  // is Latin-only, so a Devanagari headline would rasterise as empty boxes.
})

export default async function HindiLearnRoute() {
  const articles = await getKnowledgeArticles(LANG)

  return <LearnPage articles={articles} lang={LANG} />
}

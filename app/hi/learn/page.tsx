import type { Metadata }        from 'next'
import { getKnowledgeArticles } from '@/modules/learn/services/getKnowledgeArticles'
import { LearnPage }            from '@/modules/learn/components/LearnPage'
import { siteConfig }           from '@/config/site'

const LANG = 'hi' as const

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title:       `लर्न — ${siteConfig.name}`,
  description: 'कक्षीय यांत्रिकी, खगोल भौतिकी और अंतरिक्ष विज्ञान पर गहन लेख।',
  alternates: {
    canonical: '/hi/learn',
    languages: { en: '/learn', hi: '/hi/learn', 'x-default': '/learn' },
  },
}

export default async function HindiLearnRoute() {
  const articles = await getKnowledgeArticles(LANG)
  return <LearnPage articles={articles} lang={LANG} />
}

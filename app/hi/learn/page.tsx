import type { Metadata }        from 'next'
import { getKnowledgeArticles } from '@/modules/learn/services/getKnowledgeArticles'
import { LearnPage }            from '@/modules/learn/components/LearnPage'
import { localizedMetadata }    from '@/lib/pageMetadata'
import { translator }           from '@/lib/dictionaries'

const LANG = 'hi' as const
const t = translator(LANG)

export const metadata: Metadata = localizedMetadata({
  path:        '/learn',
  lang:        LANG,
  title:       t('page.learn.title'),
  description: t('page.learn.desc'),
})

export const revalidate = 300

export default async function HindiLearnRoute() {
  const articles = await getKnowledgeArticles(LANG)

  return <LearnPage articles={articles} lang={LANG} />
}

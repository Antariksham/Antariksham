import type { Metadata }      from 'next'
import { getMissions, getFeaturedMissions } from '@/modules/missions/services/getMissions'
import { MissionsPage }       from '@/modules/missions/components/MissionsPage'
import { localizedMetadata }  from '@/lib/pageMetadata'
import { translator }         from '@/lib/dictionaries'

const LANG = 'hi' as const
const t = translator(LANG)

export const metadata: Metadata = localizedMetadata({
  path:        '/missions',
  lang:        LANG,
  title:       t('page.missions.title'),
  description: t('page.missions.desc'),
})

export const revalidate = 600

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

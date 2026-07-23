import type { Metadata } from 'next'
import { getMissions } from '@/modules/missions/services/getMissions'
import { MissionsPage } from '@/modules/missions/components/MissionsPage'

const LANG = 'hi' as const

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title:       'अंतरिक्ष मिशन',
  description: 'नासा, इसरो, स्पेसएक्स, ईएसए और सभी प्रमुख एजेंसियों के सक्रिय, आगामी और ऐतिहासिक मिशन।',
  alternates: {
    canonical: '/hi/missions',
    languages: { en: '/missions', hi: '/hi/missions', 'x-default': '/missions' },
  },
}

export default async function HindiMissionsRoute() {
  const { missions, total } = await getMissions({ page: 1, perPage: 12, lang: LANG })
  return (
    <MissionsPage
      missions={missions}
      featured={[]}
      total={total}
      lang={LANG}
    />
  )
}

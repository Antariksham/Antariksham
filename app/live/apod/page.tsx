import { getAPOD } from '@/modules/nasa/services/getAPOD'
import { APODSection } from '@/modules/nasa/components/APODSection'
import type { Metadata } from 'next'

export const revalidate = 3600 // revalidate every hour

export async function generateMetadata(): Promise<Metadata> {
  const apod = await getAPOD()
  return {
    title:       apod ? `${apod.title} — APOD` : 'Astronomy Picture of the Day',
    description: apod ? apod.explanation.slice(0, 160) : 'NASA Astronomy Picture of the Day',
    openGraph: {
      images: apod?.url ? [apod.url] : [],
    },
  }
}

export default async function APODPage() {
  const apod = await getAPOD()
  return <APODSection apod={apod} />
}

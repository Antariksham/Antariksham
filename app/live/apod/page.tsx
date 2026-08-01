import { getAPOD } from '@/modules/nasa/services/getAPOD'
import { APODSection } from '@/modules/nasa/components/APODSection'
import { buildPageMetadata } from '@/modules/seo/pageMetadata'
import { ogCardPath } from '@/modules/seo/socialMeta'
import type { Metadata } from 'next'

export const revalidate = 3600 // revalidate every hour

export async function generateMetadata(): Promise<Metadata> {
  const apod = await getAPOD()
  return buildPageMetadata({
    path:        '/live/apod',
    title:       apod ? `${apod.title} — APOD` : 'Astronomy Picture of the Day',
    description: apod?.explanation || 'NASA Astronomy Picture of the Day.',
    // On video days APOD's `url` is a YouTube embed, not an image — feeding
    // that to a scraper produced a broken card, so those days fall back to a
    // generated one carrying the title.
    image:       apod?.mediaType === 'image' ? apod.url : null,
    imageAlt:    apod?.title,
    fallbackImagePath: ogCardPath({
      title:   apod?.title || 'Astronomy Picture of the Day',
      eyebrow: 'NASA APOD',
    }),
  })
}

export default async function APODPage() {
  const apod = await getAPOD()
  return <APODSection apod={apod} />
}

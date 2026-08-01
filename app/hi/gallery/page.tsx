// Hindi twin of app/gallery/page.tsx.
//
// The page BODY is shared — re-exported from the English route — so the two
// languages cannot drift apart in markup or behaviour. Only the metadata
// differs, which is the point of the twin: its own title, description,
// self-canonical and hreflang set.
//
// The body copy is still English pending translation. That is the documented
// fallback behaviour, and it is strictly better than the language switch
// dead-ending in a 404 on this path.
import type { Metadata } from 'next'
import { localizedMetadata } from '@/lib/pageMetadata'
import { translator } from '@/lib/dictionaries'

const LANG = 'hi' as const
const t = translator(LANG)

export const metadata: Metadata = localizedMetadata({
  path:        '/gallery',
  lang:        LANG,
  title:       t('page.gallery.title'),
  description: t('page.gallery.desc'),
})

export { default } from '@/app/gallery/page'

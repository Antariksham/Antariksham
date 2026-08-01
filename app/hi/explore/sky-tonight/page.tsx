// Hindi twin of app/explore/sky-tonight/page.tsx.
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
  path:        '/explore/sky-tonight',
  lang:        LANG,
  title:       t('page.skyTonight.title'),
  description: t('page.skyTonight.desc'),
})

export const revalidate = 3600

export { default } from '@/app/explore/sky-tonight/page'

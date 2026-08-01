import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { buildPageMetadata } from '@/modules/seo/pageMetadata'
import { ogCardPath } from '@/modules/seo/socialMeta'
import { LunarSimDashboard } from '@/modules/lunar-sim/components/LunarSimDashboard'

const TITLE = 'Lunar Landing Simulator'
const DESCRIPTION =
  'Watch real C++ lunar flight software — guidance, navigation, control and hazard avoidance — fly an autonomous moon landing live in your browser via WebAssembly.'

export const metadata: Metadata = buildPageMetadata({
  path:        '/lunar-sim',
  // Bare page name — the root layout's titleTemplate appends "| Antariksham"
  // and og:site_name carries the brand in the card.
  title:       TITLE,
  description: DESCRIPTION,
  fallbackImagePath: ogCardPath({ title: TITLE, eyebrow: 'Interactive' }),
})

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Lunar Landing Simulator',
  url: `${siteConfig.url}/lunar-sim`,
  description: DESCRIPTION,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any (web browser with WebAssembly)',
  isAccessibleForFree: true,
  browserRequirements: 'Requires JavaScript and WebAssembly; WebGL for the 3-D view.',
  publisher: {
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
  },
}

export default function LunarSimPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LunarSimDashboard />
    </>
  )
}

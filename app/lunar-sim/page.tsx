import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { LunarSimDashboard } from '@/modules/lunar-sim/components/LunarSimDashboard'

const TITLE = `Lunar Landing Simulator — ${siteConfig.name}`
const DESCRIPTION =
  'Watch real C++ lunar flight software — guidance, navigation, control and hazard avoidance — fly an autonomous moon landing live in your browser via WebAssembly.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/lunar-sim' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/lunar-sim',
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: 'website',
    images: [siteConfig.seo.defaultImage],
  },
  twitter: {
    card: siteConfig.seo.twitterCard,
    title: TITLE,
    description: DESCRIPTION,
  },
}

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

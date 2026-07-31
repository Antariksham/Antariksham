import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { SolarSystemExplorer } from '@/modules/explore/components/SolarSystemExplorer'
import { SOLAR_BODIES } from '@/modules/explore/services/solarSystemBodies'
import { groupMissionsByBody } from '@/modules/explore/services/bodyMissions'
import { getExploreMissions } from '@/modules/explore/services/getExploreMissions'

// Mission cross-links change rarely; the client re-syncs the displayed date
// after mount, so an hour-stale render epoch is imperceptible (< 1° of
// planetary motion).
export const revalidate = 3600

const TITLE = `Solar System Explorer — ${siteConfig.name}`
const DESCRIPTION =
  'An interactive map of the Solar System: true planet positions for any date computed from JPL orbital elements, time travel through the orbits, and every world linked to its missions, facts and coverage.'

export const metadata: Metadata = {
  // Plain name — the root layout's titleTemplate appends "| Antariksham".
  title: 'Solar System Explorer',
  description: DESCRIPTION,
  alternates: { canonical: '/explore/solar-system' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/explore/solar-system',
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: 'website',
  },
  twitter: {
    card: siteConfig.seo.twitterCard,
    title: TITLE,
    description: DESCRIPTION,
  },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Solar System Explorer',
    url: `${siteConfig.url}/explore/solar-system`,
    description: DESCRIPTION,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any (web browser)',
    isAccessibleForFree: true,
    publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Explore', item: `${siteConfig.url}/explore` },
      { '@type': 'ListItem', position: 2, name: 'Solar System', item: `${siteConfig.url}/explore/solar-system` },
    ],
  },
]

export default async function SolarSystemPage() {
  const missions = await getExploreMissions()
  const missionsByBody = groupMissionsByBody(missions, SOLAR_BODIES)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ paddingTop: 'var(--nav-height)' }}>

        <header className="page-header">
          <div className="container">
            <p className="card-category">Explore</p>
            <h1 className="page-title">Solar System Explorer</h1>
            <p className="page-lede">
              A living map of our Solar System. Every planet is drawn at its true
              position for the displayed date — select a world for its vital
              statistics, the missions flying there, and our coverage of it.
            </p>
          </div>
        </header>

        <main className="container section">
          <SolarSystemExplorer
            initialEpochMs={Date.now()}
            missionsByBody={missionsByBody}
          />
        </main>
      </div>
    </>
  )
}

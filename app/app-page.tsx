import type { Metadata } from 'next'
import { siteConfig }          from '@/config/site'
import { HeroSection }         from '@/modules/homepage/components/HeroSection'
import { StatusStrip }         from '@/modules/homepage/components/StatusStrip'
import { LatestNewsSection }   from '@/modules/homepage/components/LatestNewsSection'
import { MissionsSection }     from '@/modules/homepage/components/MissionsSection'
import { LearnSection }        from '@/modules/homepage/components/LearnSection'
import { AboutSection }        from '@/modules/homepage/components/AboutSection'
import { getLatestArticles }   from '@/modules/news/services/getArticles'
import { getFeaturedMissions } from '@/modules/missions/services/getMissions'

export const metadata: Metadata = {
  title:       siteConfig.seo.defaultTitle,
  description: siteConfig.description,
}

export const revalidate = 300

// Server Component — fetches all data, passes to client components as props
export default async function Page() {
  const [articles, missions] = await Promise.all([
    getLatestArticles(7),
    getFeaturedMissions(4),
  ])

  return (
    <>
      <HeroSection />
      <StatusStrip />
      <div className="glow-divider" />
      <div className="page-container">
        <LatestNewsSection articles={articles} />
        <MissionsSection   missions={missions} />
        <LearnSection />
        <AboutSection />
      </div>
    </>
  )
}

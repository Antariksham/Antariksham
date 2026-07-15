import { HeroSection }       from './HeroSection'
import { StatusStrip }       from './StatusStrip'
import { LatestNewsSection } from './LatestNewsSection'
import { MissionsSection }   from './MissionsSection'
import { LearnSection }      from './LearnSection'
import { AboutSection }      from './AboutSection'
import type { ArticleCard }  from '@/types/article'
import type { MissionCard }  from '@/types/mission'

interface Props {
  articles: ArticleCard[]
  missions: MissionCard[]
}

export function HomePage({ articles, missions }: Props) {
  return (
    <>
      <HeroSection />
      <StatusStrip />
      <main className="container">
        <LatestNewsSection articles={articles} />
        <MissionsSection   missions={missions} />
        <LearnSection />
        <AboutSection />
      </main>
    </>
  )
}

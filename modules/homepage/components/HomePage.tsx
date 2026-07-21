import { HeroSection }       from './HeroSection'
import { StatusStrip }       from './StatusStrip'
import { LatestArticlesSection } from './LatestArticlesSection'
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
        <LatestArticlesSection articles={articles} />
        <MissionsSection   missions={missions} />
        <LearnSection />
        <AboutSection />
      </main>
    </>
  )
}

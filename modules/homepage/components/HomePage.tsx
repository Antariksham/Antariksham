import { HeroSection }       from './HeroSection'
import { StatusStrip }       from './StatusStrip'
import { LatestArticlesSection } from './LatestArticlesSection'
import { MissionsSection }   from './MissionsSection'
import { LearnSection }      from './LearnSection'
import { AboutSection }      from './AboutSection'
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/lib/i18n'
import type { ArticleCard }  from '@/types/article'
import type { MissionCard }  from '@/types/mission'

interface Props {
  articles: ArticleCard[]
  missions: MissionCard[]
  /** Language of the home page — English by default; 'hi' for /hi. */
  lang?:    LanguageCode
}

// `lang` reaches only the sections that have a translated counterpart —
// articles, missions and learn. StatusStrip and AboutSection link into /live
// and /about, which exist in English only, so they stay unprefixed rather than
// pointing a Hindi reader at a 404.
export function HomePage({ articles, missions, lang = DEFAULT_LANGUAGE }: Props) {
  return (
    <>
      <HeroSection lang={lang} />
      <StatusStrip />
      <main className="container">
        <LatestArticlesSection articles={articles} lang={lang} />
        <MissionsSection   missions={missions} lang={lang} />
        <LearnSection lang={lang} />
        <AboutSection lang={lang} />
      </main>
    </>
  )
}

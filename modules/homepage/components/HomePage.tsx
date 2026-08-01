import { HeroSection }       from './HeroSection'
import { StatusStrip }       from './StatusStrip'
import { LatestArticlesSection } from './LatestArticlesSection'
import { MissionsSection }   from './MissionsSection'
import { LearnSection }      from './LearnSection'
import { AboutSection }      from './AboutSection'
import type { ArticleCard }  from '@/types/article'
import type { MissionCard }  from '@/types/mission'
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/lib/i18n'

interface Props {
  articles: ArticleCard[]
  missions: MissionCard[]
  lang?:    LanguageCode
}

// `lang` threads down to every section so that a reader who arrives on /hi
// stays on /hi: each section builds its own links, and an unprefixed href
// would silently drop them back into English.
export function HomePage({ articles, missions, lang = DEFAULT_LANGUAGE }: Props) {
  return (
    <>
      <HeroSection lang={lang} />
      <StatusStrip lang={lang} />
      <main className="container">
        <LatestArticlesSection articles={articles} lang={lang} />
        <MissionsSection   missions={missions} lang={lang} />
        <LearnSection lang={lang} />
        <AboutSection lang={lang} />
      </main>
    </>
  )
}

import { HeroSection }       from './HeroSection'
import { StatusStrip }       from './StatusStrip'
import { LatestNewsSection } from './LatestNewsSection'
import { MissionsSection }   from './MissionsSection'
import { LearnSection }      from './LearnSection'
import { AboutSection }      from './AboutSection'

// No 'use client' — this is a Server Component so async children work correctly.
// HeroSection and StatusStrip are self-contained client components.
// LatestNewsSection and MissionsSection are async Server Components fetching from Supabase.

export function HomePage() {
  return (
    <>
      <HeroSection />
      <StatusStrip />
      <div className="glow-divider" />
      <div className="page-container">
        <LatestNewsSection />
        <MissionsSection />
        <LearnSection />
        <AboutSection />
      </div>
    </>
  )
}

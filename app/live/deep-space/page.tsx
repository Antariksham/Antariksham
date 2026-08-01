import type { Metadata }      from 'next'
import { buildPageMetadata } from '@/modules/seo/pageMetadata'
import { getDeepSpaceProbes } from '@/modules/deepspace/services/getDeepSpace'
import { DeepSpaceTracker }   from '@/modules/deepspace/components/DeepSpaceTracker'

export const metadata: Metadata = buildPageMetadata({
  path:        '/live/deep-space',
  title:       'Deep Space Tracker',
  description: 'Live telemetry for Voyager 1, Voyager 2, Parker Solar Probe, Europa Clipper and Lucy.',
})

export default function DeepSpacePage() {
  const { probes, updatedAt } = getDeepSpaceProbes()

  return (
    <DeepSpaceTracker
      initialProbes={probes}
      updatedAt={updatedAt}
    />
  )
}

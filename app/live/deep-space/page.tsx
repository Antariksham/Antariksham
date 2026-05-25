import type { Metadata }      from 'next'
import { siteConfig }         from '@/config/site'
import { getDeepSpaceProbes } from '@/modules/deepspace/services/getDeepSpace'
import { DeepSpaceTracker }   from '@/modules/deepspace/components/DeepSpaceTracker'

export const metadata: Metadata = {
  title:       `Deep Space Tracker — ${siteConfig.name}`,
  description: 'Live telemetry for Voyager 1, Voyager 2, Parker Solar Probe, Europa Clipper and Lucy.',
}

export default function DeepSpacePage() {
  const { probes, updatedAt } = getDeepSpaceProbes()

  return (
    <DeepSpaceTracker
      initialProbes={probes}
      updatedAt={updatedAt}
    />
  )
}

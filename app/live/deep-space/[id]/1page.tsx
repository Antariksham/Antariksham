import type { Metadata }      from 'next'
import { notFound }           from 'next/navigation'
import { siteConfig }         from '@/config/site'
import { getDeepSpaceProbes } from '@/modules/deepspace/services/getDeepSpace'
import { ProbeDetailPage }    from '@/modules/deepspace/components/ProbeDetailPage'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { probes } = getDeepSpaceProbes()
  const probe = probes.find(p => p.id === params.id)
  if (!probe) return { title: 'Probe Not Found' }
  return {
    title:       `${probe.name} — Deep Space Tracker | ${siteConfig.name}`,
    description: `Live telemetry for ${probe.name}: distance, velocity and signal delay from NASA Horizons.`,
  }
}

export default function ProbePage({ params }: Props) {
  const { probes, updatedAt } = getDeepSpaceProbes()
  const probe = probes.find(p => p.id === params.id)

  if (!probe) {
    notFound()
    return null  // TypeScript narrowing — notFound() throws but TS doesn't know
  }

  return (
    <ProbeDetailPage
      probe={probe}
      allProbes={probes}
      updatedAt={updatedAt}
    />
  )
}

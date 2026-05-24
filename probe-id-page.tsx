import type { Metadata }      from 'next'
import { notFound }           from 'next/navigation'
import { siteConfig }         from '@/config/site'
import { getDeepSpaceProbes } from '@/modules/deepspace/services/getDeepSpace'
import { ProbeDetailPage }    from '@/modules/deepspace/components/ProbeDetailPage'

export const revalidate = 3600

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { probes } = await getDeepSpaceProbes()
  const probe      = probes.find(p => p.id === params.id)
  if (!probe) return { title: 'Probe Not Found' }

  return {
    title:       `${probe.name} — Deep Space Tracker | ${siteConfig.name}`,
    description: `Live telemetry for ${probe.name}: distance from Earth, velocity, signal delay, and mission status from NASA Horizons.`,
  }
}

export default async function ProbePage({ params }: Props) {
  const { probes, updatedAt } = await getDeepSpaceProbes()
  const probe = probes.find(p => p.id === params.id)

  if (!probe) notFound()

  return <ProbeDetailPage probe={probe} allProbes={probes} updatedAt={updatedAt} />
}

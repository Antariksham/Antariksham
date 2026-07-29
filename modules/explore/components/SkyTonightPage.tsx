'use client'

import { useEffect, useState } from 'react'
import { formatUTCDate } from '../services/orrery'
import { MoonPhaseCard } from './MoonPhaseCard'
import { PlanetsTonight } from './PlanetsTonight'
import { IssPassesCard } from './IssPassesCard'

interface Props {
  /**
   * Epoch the server rendered for — serialized as a prop so SSR and hydration
   * agree; the client silently re-syncs to "now" after mount (§6 rule).
   */
  initialEpochMs: number
}

export function SkyTonightPage({ initialEpochMs }: Props) {
  const [epochMs, setEpochMs] = useState(initialEpochMs)
  useEffect(() => { setEpochMs(Date.now()) }, [])

  return (
    <div>
      <p className="orrery-date" style={{ marginBottom: 18 }}>
        Sky for {formatUTCDate(epochMs)} (UTC)
      </p>

      <div className="sky-grid">
        <MoonPhaseCard epochMs={epochMs} />
        <IssPassesCard />
      </div>

      <div style={{ marginTop: 24 }}>
        <PlanetsTonight epochMs={epochMs} />
      </div>
    </div>
  )
}

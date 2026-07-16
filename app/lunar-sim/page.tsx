import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { LunarSimDashboard } from '@/modules/lunar-sim/components/LunarSimDashboard'

// Testing page (not linked from the nav, noindex): live lunar-descent
// telemetry from the SELENE C++ flight software compiled to WebAssembly.
// If the experiment ships, drop the robots override and add JSON-LD/OG
// per MIGRATION.md §6; if it doesn't, delete app/lunar-sim + modules/lunar-sim
// + public/wasm.
export const metadata: Metadata = {
  title: `Lunar Landing Simulator — ${siteConfig.name}`,
  description:
    'Watch real C++ lunar flight software — guidance, navigation, control and hazard avoidance — fly an autonomous moon landing live in your browser via WebAssembly.',
  robots: { index: false, follow: false },
}

export default function LunarSimPage() {
  return <LunarSimDashboard />
}

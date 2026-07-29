/**
 * Destination → Solar-System-body matching for the Explore section.
 *
 * The missions database stores a free-text primary `destination` ("Mars",
 * "Lunar south pole", "Jupiter's moon Europa", …). This pure, DOM-free module
 * maps each mission onto the explorer's bodies so the facts panel can show
 * "missions that went here". Unit-tested with node:test.
 */

export interface ExploreMissionRef {
  name:        string
  slug:        string
  status:      string
  destination: string | null
  launchDate:  string | null
}

interface AliasedBody {
  id:      string
  aliases: string[]
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Match a free-text destination to a body id, or null when nothing matches.
 *
 * Every alias is matched as a whole word (so "leo" never fires inside
 * "Galileo"); when aliases of several bodies hit ("Jupiter's moon Europa"
 * contains both `moon` and `europa`), the LONGEST matching alias wins —
 * more specific beats more generic.
 */
export function matchBodyForDestination(
  destination: string | null | undefined,
  bodies: AliasedBody[],
): string | null {
  if (!destination) return null
  const text = destination.toLowerCase()

  let bestId: string | null = null
  let bestLen = 0
  for (const body of bodies) {
    for (const alias of body.aliases) {
      if (alias.length <= bestLen) continue
      if (new RegExp(`\\b${escapeRegExp(alias)}\\b`).test(text)) {
        bestId = body.id
        bestLen = alias.length
      }
    }
  }
  return bestId
}

/**
 * Group missions by matched body id, newest launch first (missions with no
 * launch date sink to the end). Unmatched missions are simply left out.
 */
export function groupMissionsByBody(
  missions: ExploreMissionRef[],
  bodies: AliasedBody[],
): Record<string, ExploreMissionRef[]> {
  const grouped: Record<string, ExploreMissionRef[]> = {}
  for (const mission of missions) {
    const id = matchBodyForDestination(mission.destination, bodies)
    if (!id) continue
    ;(grouped[id] ||= []).push(mission)
  }
  for (const id of Object.keys(grouped)) {
    grouped[id].sort((a, b) => {
      if (!a.launchDate) return b.launchDate ? 1 : 0
      if (!b.launchDate) return -1
      return b.launchDate.localeCompare(a.launchDate)
    })
  }
  return grouped
}

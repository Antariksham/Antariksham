import type { ExploreMissionRef } from './bodyMissions'

/**
 * Lightweight mission refs for the Solar System explorer's "missions that
 * went here" cross-links. SSR-only (the explorer receives the grouped result
 * as a prop); degrades gracefully to [] on any error so the orrery still
 * renders without a database. The Supabase client is imported lazily because
 * `lib/supabase` throws at module load when env vars are absent — a dynamic
 * import keeps that failure inside this catch instead of 500ing the page.
 */
export async function getExploreMissions(): Promise<ExploreMissionRef[]> {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data, error } = await supabase
      .from('missions')
      .select('name, slug, status, destination, launch_date')
      .order('launch_date', { ascending: false, nullsFirst: false })
      .limit(300)

    if (error || !data) return []
    return data.map((m: any) => ({
      name:        m.name,
      slug:        m.slug,
      status:      m.status,
      destination: m.destination,
      launchDate:  m.launch_date,
    }))
  } catch {
    return []
  }
}

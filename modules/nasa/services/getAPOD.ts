import { supabase } from '@/lib/supabase'
import type { NASAApod } from '@/types/api'

// Read APOD from Supabase cache — never call NASA directly from frontend
export async function getAPOD(): Promise<NASAApod | null> {
  const { data, error } = await supabase
    .from('live_data')
    .select('value, synced_at, expires_at')
    .eq('key', 'apod_today')
    .single()

  if (error || !data) return null

  return data.value as NASAApod
}

// Check if APOD cache is stale (older than 24 hours)
export async function isAPODStale(): Promise<boolean> {
  const { data, error } = await supabase
    .from('live_data')
    .select('expires_at')
    .eq('key', 'apod_today')
    .single()

  if (error || !data) return true

  const expiresAt = new Date(data.expires_at)
  return expiresAt < new Date()
}

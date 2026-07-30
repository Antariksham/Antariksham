import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin }             from '@/lib/supabase'

import { getAdminUser } from '@/modules/admin/services/getAdminUser'

export const dynamic = 'force-dynamic'

const SHA256_HEX = /^[0-9a-f]{64}$/

// ── POST /api/admin/media/precheck ────────────────────────────────────────────
// Body: { checksums: string[] }  (SHA-256 hex, computed in the browser)
//
// Answers "do you already have these bytes?" before anything is uploaded. The
// dialog uses it to mark duplicates, so re-adding a photo that is already in
// the library costs one small request instead of a 5MB upload and a second
// copy of the same image.
//
// The upload route repeats this check server-side with a checksum it computes
// itself — this one is an optimisation, not a gate.
export async function POST(req: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body      = await req.json().catch(() => ({}))
  const checksums = Array.isArray(body?.checksums) ? body.checksums : []
  const valid     = checksums
    .filter((c: unknown): c is string => typeof c === 'string' && SHA256_HEX.test(c))
    .slice(0, 100)

  if (valid.length === 0) {
    return NextResponse.json({ matches: {} })
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from('media_assets')
      .select('id, checksum_sha256, file_url, thumb_url, title')
      .in('checksum_sha256', valid)
      .is('deleted_at', null)

    if (error) throw error

    // checksum → the asset already holding those bytes
    const matches: Record<string, { id: string; url: string; thumbUrl: string | null; title: string | null }> = {}
    for (const row of data || []) {
      matches[row.checksum_sha256 as string] = {
        id:       row.id as string,
        url:      row.file_url as string,
        thumbUrl: (row.thumb_url as string) || null,
        title:    (row.title as string) || null,
      }
    }

    return NextResponse.json({ matches })
  } catch (err: any) {
    console.error('media precheck error:', err)
    return NextResponse.json({ error: err.message || 'Precheck failed' }, { status: 500 })
  }
}

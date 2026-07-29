import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin }             from '@/lib/supabase'

import { getAdminUser } from '@/modules/admin/services/getAdminUser'

export const dynamic = 'force-dynamic'

// ── GET /api/admin/media/tags?prefix=ma&provider=supabase ─────────────────────
// Existing tags matching a prefix, most-used first. Feeds the upload dialog's
// autocomplete so the tag vocabulary converges instead of drifting.
export async function GET(req: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params   = req.nextUrl.searchParams
  const provider = params.get('provider')

  try {
    const { data, error } = await supabaseAdmin().rpc('media_tag_suggestions', {
      p_prefix:   params.get('prefix')?.trim() || null,
      p_provider: provider === 'supabase' || provider === 'cloudinary' ? provider : null,
      p_limit:    12,
    })

    if (error) throw error

    return NextResponse.json({
      tags: (data || []).map((r: any) => ({ tag: r.tag as string, uses: Number(r.uses) })),
    })
  } catch (err: any) {
    console.error('media tag suggestions error:', err)
    // Autocomplete is a convenience — a failure here must not break the dialog.
    return NextResponse.json({ tags: [] })
  }
}

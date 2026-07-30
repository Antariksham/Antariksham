import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin }             from '@/lib/supabase'

import { getAdminUser } from '@/modules/admin/services/getAdminUser'
import { slugify, normalizeTags } from '@/modules/admin/media/mediaNaming'

export const dynamic = 'force-dynamic'

// ── PATCH /api/admin/media/<id> ───────────────────────────────────────────────
// Edit an asset's descriptive metadata. Provider-agnostic, because Cloudinary
// uploads go through a third-party widget that cannot be intercepted before the
// bytes land — their metadata is collected right after, and written here.
//
// Only descriptive fields are editable. Storage keys, URLs and checksums are
// not: published articles reference the URL, and the checksum describes bytes
// nobody is changing.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = params.id
  if (!id) {
    return NextResponse.json({ error: 'Missing asset id' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}

  // A title change moves the slug with it — the slug feeds the search vector,
  // so leaving it stale would make the asset findable under its old name only.
  if (typeof body.title === 'string') {
    const title = body.title.trim()
    if (!title) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
    }
    patch.title = title
    patch.slug  = slugify(title)
  }

  // Empty string is meaningful for alt text: it marks a decorative image, which
  // is different from "not described yet".
  if (typeof body.altText === 'string') patch.alt_text = body.altText.trim()
  if (typeof body.caption === 'string') patch.caption  = body.caption.trim() || null
  if (typeof body.credit  === 'string') patch.credit   = body.credit.trim()  || null
  if (Array.isArray(body.tags))         patch.tags     = normalizeTags(body.tags.map(String))

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from('media_assets')
      .update(patch)
      .eq('id', id)
      .is('deleted_at', null)
      .select('id, title, alt_text, credit, tags')
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true, asset: data })
  } catch (err: any) {
    console.error('media patch error:', err)
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 })
  }
}

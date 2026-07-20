import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin }             from '@/lib/supabase'
import { getAdminUser }              from '@/modules/admin/services/getAdminUser'

export const dynamic = 'force-dynamic'

// ── GET /api/admin/seo?search=xxx  ────────────────────────────
// List all seo_metadata rows, optionally filtered by search
export async function GET(req: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const search = req.nextUrl.searchParams.get('search') || ''

  try {
    const db = supabaseAdmin()

    let query = db
      .from('seo_metadata')
      .select('*')
      .order('updated_at', { ascending: false })

    if (search) {
      query = query.or(
        `meta_title.ilike.%${search}%,meta_description.ilike.%${search}%,canonical_url.ilike.%${search}%`
      )
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ rows: data || [] })
  } catch (err: any) {
    console.error('seo list error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch SEO entries' }, { status: 500 })
  }
}

// ── POST /api/admin/seo — create new seo_metadata row ─────────
export async function POST(req: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body    = await req.json()
    const payload = buildPayload(body)

    if (!payload.metaTitle) {
      return NextResponse.json({ error: 'Meta title is required' }, { status: 400 })
    }

    const db = supabaseAdmin()
    const { data, error } = await db
      .from('seo_metadata')
      .insert({
        meta_title:       payload.metaTitle,
        meta_description: payload.metaDescription,
        og_image:         payload.ogImage,
        keywords:         payload.keywords,
        canonical_url:    payload.canonicalUrl,
        schema_markup:    payload.schemaMarkup,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('seo create error:', error)
      return NextResponse.json({ error: 'Failed to create SEO entry' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (err: any) {
    console.error('seo create error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── PATCH /api/admin/seo?id=xxx — update existing row ─────────
export async function PATCH(req: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const body    = await req.json()
    const payload = buildPayload(body)

    if (!payload.metaTitle) {
      return NextResponse.json({ error: 'Meta title is required' }, { status: 400 })
    }

    const db = supabaseAdmin()
    const { error } = await db
      .from('seo_metadata')
      .update({
        meta_title:       payload.metaTitle,
        meta_description: payload.metaDescription,
        og_image:         payload.ogImage,
        keywords:         payload.keywords,
        canonical_url:    payload.canonicalUrl,
        schema_markup:    payload.schemaMarkup,
        updated_at:       new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('seo update error:', error)
      return NextResponse.json({ error: 'Failed to update SEO entry' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('seo update error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── DELETE /api/admin/seo?id=xxx — delete row ─────────────────
export async function DELETE(req: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const db = supabaseAdmin()
    const { error } = await db
      .from('seo_metadata')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('seo delete error:', error)
      return NextResponse.json({ error: 'Failed to delete SEO entry' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('seo delete error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── Helper ────────────────────────────────────────────────────

function buildPayload(body: any) {
  return {
    metaTitle:       String(body.metaTitle       || '').trim().slice(0, 100),
    metaDescription: String(body.metaDescription || '').trim().slice(0, 300),
    ogImage:         String(body.ogImage         || '').trim() || null,
    keywords:        String(body.keywords        || '').trim() || null,
    canonicalUrl:    String(body.canonicalUrl    || '').trim() || null,
    schemaMarkup:    body.schemaMarkup            || null,
  }
}

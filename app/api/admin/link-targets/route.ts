import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'
import type { LinkTarget } from '@/modules/admin/links/internalLinks'

// GET /api/admin/link-targets — the internal pages the Linking Assistant can
// suggest / link to: published articles (with facets for relevance), missions,
// learn pages and authors. Each query is isolated so one failing table can't
// take down the rest.
export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const targets: LinkTarget[] = []

  const safe = async (fn: () => Promise<void>) => { try { await fn() } catch (e) { console.error('link-targets:', e) } }

  await Promise.all([
    safe(async () => {
      const { data } = await db
        .from('articles')
        .select('slug, title, status, article_categories ( categories ( name ) ), article_tags ( tags ( name ) )')
        .eq('status', 'published')
        .limit(2000)
      ;(data || []).forEach((r: any) => targets.push({
        kind: 'article', title: r.title, slug: r.slug, href: `/article/${r.slug}`,
        categories: (r.article_categories || []).map((ac: any) => ac.categories?.name).filter(Boolean),
        tags: (r.article_tags || []).map((at: any) => at.tags?.name).filter(Boolean),
      }))
    }),
    safe(async () => {
      const { data } = await db.from('missions').select('slug, name').limit(1000)
      ;(data || []).forEach((r: any) => r.slug && targets.push({ kind: 'mission', title: r.name, slug: r.slug, href: `/mission/${r.slug}` }))
    }),
    safe(async () => {
      const { data } = await db.from('knowledge_articles').select('slug, title').limit(2000)
      ;(data || []).forEach((r: any) => r.slug && targets.push({ kind: 'learn', title: r.title, slug: r.slug, href: `/learn/${r.slug}` }))
    }),
    safe(async () => {
      const { data } = await db.from('authors').select('slug, name').limit(1000)
      ;(data || []).forEach((r: any) => r.slug && targets.push({ kind: 'author', title: r.name, slug: r.slug, href: `/authors/${r.slug}` }))
    }),
  ])

  return NextResponse.json({ targets })
}

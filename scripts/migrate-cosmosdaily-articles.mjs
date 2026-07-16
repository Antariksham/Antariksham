/**
 * One-time migration: CosmosDaily (old, static site's Supabase project) articles
 * → Antariksham (this engine's Supabase project).
 *
 * The two live in SEPARATE Supabase projects, so this reads from the old project
 * and writes into the new one, reshaping the old flat schema into the new
 * relational one (authors / categories / tags / seo_metadata).
 *
 * SAFETY
 *   - Dry-run by DEFAULT. It only reads. Pass `--apply` to actually write.
 *   - Idempotent: articles are matched by `slug` in the target. Existing slugs
 *     are skipped (default) or updated (`--mode=update`), so re-running is safe.
 *   - Run the dry-run first, eyeball the plan + warnings, then `--apply` a single
 *     article (`--slug=some-slug`) before doing the whole set.
 *
 * USAGE
 *   OLD_SUPABASE_URL=...  OLD_SUPABASE_SERVICE_KEY=... \
 *   NEW_SUPABASE_URL=...  NEW_SUPABASE_SERVICE_KEY=... \
 *   node scripts/migrate-cosmosdaily-articles.mjs [--apply] [--mode=skip|update] [--slug=X] [--limit=N]
 *
 *   Use the SERVICE ROLE keys (not anon) — inserts into authors/categories/tags
 *   and cross-referencing slugs need to bypass RLS.
 *
 * SCHEMA ASSUMPTIONS (verify against your target before --apply)
 *   articles(id uuid, title, slug unique, excerpt, content, featured_image,
 *            author_id -> authors.id, status, article_type, published_at,
 *            updated_at, reading_time int, views int, featured bool)
 *   authors(id uuid, name, avatar, bio, social_links, featured)
 *   categories(id uuid, name, slug, color)          -- the 10 topic categories
 *   article_categories(article_id, category_id)     -- join
 *   tags(id uuid, name, slug)
 *   article_tags(article_id, tag_id)                -- join
 *   seo_metadata(article_id, meta_title, meta_description, og_image,
 *                canonical_url, keywords)
 *   These mirror the relationships in modules/news/services/getArticles.ts.
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID }   from 'node:crypto'

// ── Config — every gap decision is a one-line edit here ───────────────────────
const CONFIG = {
  onlyPublished:      false,        // true = skip old drafts (published === false)
  defaultArticleType: 'analysis',   // old schema has no type; new one requires it
  markNoneFeatured:   true,         // import all as featured=false; curate in the CMS
  appendReferences:   true,         // render old `article_references` into content
  appendImageCredit:  true,         // add old `image_credit` as a caption in content
  siteUrl:            'https://cosmosdaily.space',
  // old lowercase category string → new proper-case category (matches ArticleCategory)
  categoryMap: {
    nasa: 'NASA', spacex: 'SpaceX', isro: 'ISRO', esa: 'ESA', jaxa: 'JAXA',
    astronomy: 'Astronomy', discoveries: 'Discoveries', technology: 'Technology',
    missions: 'Missions', science: 'Science',
  },
}

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args   = process.argv.slice(2)
const APPLY  = args.includes('--apply')
const MODE   = (args.find(a => a.startsWith('--mode=')) || '--mode=skip').split('=')[1]
const ONLY   = (args.find(a => a.startsWith('--slug=')) || '').split('=')[1] || null
const LIMIT  = Number((args.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity

// ── Clients ───────────────────────────────────────────────────────────────────
function reqEnv(name) {
  const v = process.env[name]
  if (!v) { console.error(`Missing env ${name}`); process.exit(1) }
  return v
}
const oldDb = createClient(reqEnv('OLD_SUPABASE_URL'), reqEnv('OLD_SUPABASE_SERVICE_KEY'), { auth: { persistSession: false } })
const newDb = createClient(reqEnv('NEW_SUPABASE_URL'), reqEnv('NEW_SUPABASE_SERVICE_KEY'), { auth: { persistSession: false } })

const slugify = (s) => String(s || '').toLowerCase().trim()
  .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')

const warnings = []
const warn = (slug, msg) => warnings.push(`  ⚠ [${slug || '?'}] ${msg}`)

// Build the target `content` HTML, folding in references + image credit if kept.
function buildContent(a) {
  let html = a.body || a.content || ''
  if (CONFIG.appendImageCredit && a.image_credit) {
    html += `\n<p class="image-credit"><em>Image credit: ${a.image_credit}</em></p>`
  }
  if (CONFIG.appendReferences && Array.isArray(a.article_references) && a.article_references.length) {
    const items = a.article_references
      .filter(r => r && (r.text || r.url))
      .map(r => r.url ? `<li><a href="${r.url}">${r.text || r.url}</a></li>` : `<li>${r.text}</li>`)
      .join('')
    if (items) html += `\n<h2>References</h2>\n<ul>${items}</ul>`
  }
  return html
}

// Upsert a row by a unique column, returning its id (creates if missing).
async function ensureRow(table, matchCol, matchVal, insertRow) {
  const { data: found, error: selErr } = await newDb.from(table).select('id').eq(matchCol, matchVal).maybeSingle()
  if (selErr) throw new Error(`${table} lookup failed: ${selErr.message}`)
  if (found) return { id: found.id, created: false }
  if (!APPLY) return { id: `(new ${table})`, created: true }
  const { data: ins, error: insErr } = await newDb.from(table).insert(insertRow).select('id').single()
  if (insErr) throw new Error(`${table} insert failed: ${insErr.message}`)
  return { id: ins.id, created: true }
}

async function migrateOne(a) {
  const slug = slugify(a.slug || a.title)
  if (!slug) { warn(a.title, 'no slug/title — skipped'); return { status: 'skipped' } }

  // Already in target?
  const { data: existing } = await newDb.from('articles').select('id').eq('slug', slug).maybeSingle()
  if (existing && MODE === 'skip') { return { status: 'exists-skip', slug } }

  // Author (old `author` is a display-name string)
  let authorId = null
  if (a.author) {
    const r = await ensureRow('authors', 'name', a.author, { name: a.author, featured: false })
    authorId = r.id
    if (r.created) warn(slug, `new author "${a.author}"`)
  }

  // Category (single, lowercase in old)
  const catName = CONFIG.categoryMap[slugify(a.category)] || null
  if (a.category && !catName) warn(slug, `category "${a.category}" not in categoryMap — left uncategorised`)

  // Tags (array in old)
  const tags = Array.isArray(a.tags) ? a.tags.filter(Boolean) : []

  const target = {
    id:            existing?.id || randomUUID(),
    title:         a.title,
    slug,
    excerpt:       a.excerpt || '',
    content:       buildContent(a),
    featured_image:a.image || null,
    author_id:     authorId,
    status:        a.published ? 'published' : 'draft',
    article_type:  CONFIG.defaultArticleType,
    published_at:  a.date ? new Date(a.date).toISOString() : null,
    reading_time:  a.read_time || null,
    views:         a.views || 0,
    featured:      CONFIG.markNoneFeatured ? false : !!a.featured,
  }
  if (!target.featured_image) warn(slug, 'no featured_image')

  if (!APPLY) {
    return { status: existing ? 'would-update' : 'would-insert', slug, target, catName, tags }
  }

  // Write article (insert or update)
  if (existing) {
    const { error } = await newDb.from('articles').update(target).eq('id', existing.id)
    if (error) throw new Error(`article update failed: ${error.message}`)
  } else {
    const { error } = await newDb.from('articles').insert(target)
    if (error) throw new Error(`article insert failed: ${error.message}`)
  }

  // Category join
  if (catName) {
    const cat = await ensureRow('categories', 'name', catName, { name: catName, slug: slugify(catName), color: '#4f8ef7' })
    await newDb.from('article_categories').upsert({ article_id: target.id, category_id: cat.id }, { onConflict: 'article_id,category_id' })
  }
  // Tag joins
  for (const t of tags) {
    const tag = await ensureRow('tags', 'slug', slugify(t), { name: t, slug: slugify(t) })
    await newDb.from('article_tags').upsert({ article_id: target.id, tag_id: tag.id }, { onConflict: 'article_id,tag_id' })
  }
  // SEO parity
  await newDb.from('seo_metadata').upsert({
    article_id:       target.id,
    meta_title:       a.title,
    meta_description: a.excerpt || '',
    og_image:         a.image || null,
    canonical_url:    `${CONFIG.siteUrl}/news/${slug}`,
    keywords:         tags,
  }, { onConflict: 'article_id' })

  return { status: existing ? 'updated' : 'inserted', slug }
}

async function main() {
  console.log(`\nCosmosDaily → Antariksham article migration`)
  console.log(`mode: ${APPLY ? 'APPLY (writes!)' : 'DRY-RUN (read-only)'} · dup-mode: ${MODE}${ONLY ? ` · only slug=${ONLY}` : ''}\n`)

  let q = oldDb.from('articles').select('*').order('date', { ascending: false })
  if (CONFIG.onlyPublished) q = q.eq('published', true)
  const { data: rows, error } = await q
  if (error) { console.error('Failed to read old articles:', error.message); process.exit(1) }

  let list = rows || []
  if (ONLY)  list = list.filter(a => slugify(a.slug || a.title) === ONLY)
  list = list.slice(0, LIMIT)
  console.log(`Old articles to process: ${list.length}\n`)

  const tally = {}
  for (const a of list) {
    try {
      const r = await migrateOne(a)
      tally[r.status] = (tally[r.status] || 0) + 1
      const label = r.slug || slugify(a.slug || a.title)
      if (!APPLY && r.target) {
        console.log(`• ${label}\n    type=${r.target.article_type} status=${r.target.status} cat=${r.catName || '—'} tags=[${(r.tags||[]).join(', ')}] author_id=${r.target.author_id || '—'} img=${r.target.featured_image ? 'yes' : 'NO'}`)
      } else {
        console.log(`• ${label} → ${r.status}`)
      }
    } catch (e) {
      tally.error = (tally.error || 0) + 1
      warn(slugify(a.slug || a.title), e.message)
    }
  }

  console.log(`\nSummary:`)
  for (const [k, v] of Object.entries(tally)) console.log(`  ${k}: ${v}`)
  if (warnings.length) { console.log(`\nWarnings (${warnings.length}):`); console.log(warnings.join('\n')) }
  if (!APPLY) console.log(`\nDry-run only — nothing was written. Re-run with --apply to migrate.\n`)
}

main().catch(e => { console.error(e); process.exit(1) })

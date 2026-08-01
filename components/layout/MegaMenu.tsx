'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { mainNav, isCurrent, sectionIsCurrent, type NavItem } from '@/config/navigation'
import { SmartImage } from '@/components/ui/SmartImage'
import { formatDateShort } from '@/lib/utils'

/** The shape the /api/articles proxy returns, narrowed to what a card needs. */
type Highlight = {
  slug:          string
  title:         string
  featuredImage: string | null
  publishedAt:   string | null
  readingTime:   number
}

const HIGHLIGHT_COUNT = 3

/**
 * Module-level, so the highlights are fetched once per page rather than once
 * per open — the panel unmounts every time it closes.
 *
 * Deliberately not an in-component ref + AbortController: the panel's mount is
 * exactly the kind that gets torn down and rebuilt (React StrictMode does it on
 * purpose in development), and a "have I fetched?" ref paired with an abort on
 * cleanup cancels the only attempt and then declines to retry it. Caching the
 * promise instead makes the double-mount harmless and dedupes concurrent opens.
 */
let cache: Highlight[] | null = null
let inflight: Promise<Highlight[]> | null = null

function loadHighlights(): Promise<Highlight[]> {
  if (cache) return Promise.resolve(cache)
  if (inflight) return inflight

  /* Lazily fetched on first open rather than server-rendered with the nav. The
     bar is in the root layout, so SSR-ing this would put an articles query on
     every page load site-wide to fill a panel most visits never open. */
  inflight = fetch(`/api/articles?page=1&perPage=${HIGHLIGHT_COUNT}`)
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
    .then((data) => {
      const list: Highlight[] = Array.isArray(data?.articles)
        ? data.articles.slice(0, HIGHLIGHT_COUNT)
        : []
      cache = list
      inflight = null
      return list
    })
    .catch((err) => {
      inflight = null          // let a later open try again
      throw err
    })

  return inflight
}

/**
 * Desktop mega-menu panel — the wide drawer under the nav bar.
 *
 * Three columns, the nasa.gov arrangement:
 *   left   every section, the open one marked
 *   middle that section's sub-pages, headed by a link to the section itself
 *   right  HIGHLIGHTS — the latest articles
 *
 * The left column carries **all** of `mainNav`, not `desktopNav`: this panel
 * has vertical room the one-line bar does not, so Home and Missions are
 * reachable from the desktop chrome here for the first time.
 *
 * `section` is which column-two list is showing; `onSectionChange` lets the
 * left column re-point it without closing and reopening the panel.
 */
export function MegaMenu({
  section,
  pathname,
  onSectionChange,
  onNavigate,
  panelRef,
}: {
  section: NavItem
  pathname: string
  onSectionChange: (next: NavItem) => void
  onNavigate: () => void
  panelRef?: React.RefObject<HTMLDivElement>
}) {
  // Seeded from the cache, so a second open paints instantly with no skeleton.
  const [highlights, setHighlights] = useState<Highlight[] | null>(cache)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    loadHighlights()
      .then((list) => { if (alive) setHighlights(list) })
      .catch(() => { if (alive) setFailed(true) })   // the column degrades away
    return () => { alive = false }
  }, [])

  const children = section.children ?? []

  return (
    <div className="mega" ref={panelRef}>
      <div className="mega__inner">

        {/* ── COLUMN 1 — every section ──
            Hovering or activating an entry re-points column two. Merely
            *focusing* one deliberately does not: tabbing through the list would
            then swap the detail column out from under a keyboard user, so they
            could never tab from the section they opened to its own links. */}
        <ul className="mega__sections" aria-label="Sections">
          {mainNav.map((item) => {
            const open = item.href === section.href
            const hasChildren = Boolean(item.children?.length)
            return (
              <li key={item.href}>
                {/* A section with sub-pages re-points column two; one without
                    has nothing to show there, so it just navigates. */}
                {hasChildren ? (
                  <button
                    type="button"
                    className="mega__section"
                    data-open={open}
                    data-live={item.isLive ? 'true' : undefined}
                    aria-current={sectionIsCurrent(pathname, item) ? 'page' : undefined}
                    aria-expanded={open}
                    onMouseEnter={() => onSectionChange(item)}
                    onClick={() => onSectionChange(item)}
                  >
                    {item.isLive && <span className="mega__dot" aria-hidden="true" />}
                    {item.label}
                    <ChevronRight className="mega__section-icon" size={15} aria-hidden="true" />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="mega__section"
                    data-open={open}
                    data-live={item.isLive ? 'true' : undefined}
                    aria-current={sectionIsCurrent(pathname, item) ? 'page' : undefined}
                    onMouseEnter={() => onSectionChange(item)}
                    onClick={onNavigate}
                  >
                    {item.isLive && <span className="mega__dot" aria-hidden="true" />}
                    {item.label}
                    <ArrowRight className="mega__section-icon" size={15} aria-hidden="true" />
                  </Link>
                )}
              </li>
            )
          })}
        </ul>

        {/* ── COLUMN 2 — the open section ── */}
        <div className="mega__detail">
          <Link
            href={section.href}
            className="mega__title"
            aria-label={`${section.label} — section overview`}
            aria-current={isCurrent(pathname, section.href) ? 'page' : undefined}
            onClick={onNavigate}
          >
            {section.label}
            <span className="mega__title-go" aria-hidden="true"><ArrowRight size={16} /></span>
          </Link>

          {section.description && <p className="mega__desc">{section.description}</p>}

          {children.length > 0 && (
            <ul className="mega__links">
              {children.map((child) => (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    className="mega__link"
                    aria-current={isCurrent(pathname, child.href) ? 'page' : undefined}
                    onClick={onNavigate}
                  >
                    <span>{child.label}</span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── COLUMN 3 — highlights ── */}
        <div className="mega__highlights">
          <div className="mega__eyebrow">Highlights</div>

          {/* Skeletons while in flight; the whole column simply goes away if
              the request failed or there is nothing published yet. */}
          {highlights === null && !failed && (
            <div className="mega__cards" aria-hidden="true">
              {Array.from({ length: HIGHLIGHT_COUNT }, (_, i) => (
                <div className="mega__card mega__card--skeleton" key={i}>
                  <div className="mega__thumb" />
                  <div className="mega__card-body">
                    <span className="mega__skeleton-line" />
                    <span className="mega__skeleton-line mega__skeleton-line--short" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {highlights && highlights.length > 0 && (
            <div className="mega__cards">
              {highlights.map((article) => (
                <Link
                  key={article.slug}
                  href={`/article/${article.slug}`}
                  className="mega__card"
                  onClick={onNavigate}
                >
                  <div className="mega__thumb">
                    {article.featuredImage && (
                      <SmartImage
                        src={article.featuredImage}
                        alt=""
                        width={160}
                        height={120}
                        sizes="120px"
                      />
                    )}
                  </div>
                  <div className="mega__card-body">
                    <div className="mega__card-meta">
                      {article.readingTime > 0 && <span>{article.readingTime} min read</span>}
                      {article.publishedAt && <span>{formatDateShort(article.publishedAt)}</span>}
                    </div>
                    <div className="mega__card-title">{article.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {(failed || highlights?.length === 0) && (
            <p className="mega__desc">Fresh coverage lands on the articles page.</p>
          )}

          <Link href="/articles" className="mega__all" onClick={onNavigate}>
            All articles
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>

      </div>
    </div>
  )
}

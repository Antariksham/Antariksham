/**
 * The navigation tree and the "which section am I in" logic.
 *
 * Two things here are worth pinning. The first is that **every href in the nav
 * resolves to a route that exists** — CLAUDE.md's rule that nothing on this
 * site may navigate to a 404, checked against `app/` rather than trusted. The
 * mobile drawer surfaces ~25 links across three levels, so a renamed route
 * would otherwise go unnoticed until someone tapped it on a phone.
 *
 * The second is the current-page matching, which is prefix-based and therefore
 * exactly the kind of thing that quietly over-matches: `/` against everything,
 * `/live` against `/lunar-sim`, `/articles` against `/article/:slug`.
 *
 * Zero-dependency (node:test). Run with:
 *
 *     node --test --experimental-strip-types config/navigation.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  mainNav,
  desktopNav,
  footerNav,
  isCurrent,
  sectionIsCurrent,
  type NavItem,
} from './navigation.ts'

const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'app')

/** Every item in the tree, parents and leaves alike, depth-first. */
function flatten(items: NavItem[]): NavItem[] {
  return items.flatMap((item) => [item, ...flatten(item.children ?? [])])
}

/**
 * Resolve an app-router href to a `page.tsx` on disk. Walks segment by segment,
 * preferring a literal directory and falling back to a dynamic one (`[slug]`,
 * `[...rest]`) — which is how `/explore/topics/mars` finds `[slug]`.
 */
function routeExists(href: string): boolean {
  const segments = href.split('/').filter(Boolean)
  let dir = APP_DIR

  for (const segment of segments) {
    const literal = join(dir, segment)
    if (existsSync(literal)) {
      dir = literal
      continue
    }
    const dynamic = readdirSync(dir, { withFileTypes: true })
      .find((entry) => entry.isDirectory() && entry.name.startsWith('['))
    if (!dynamic) return false
    dir = join(dir, dynamic.name)
  }

  return existsSync(join(dir, 'page.tsx'))
}

test('every nav href points at a route that exists', () => {
  const all = [
    ...flatten(mainNav),
    ...footerNav.platform,
    ...footerNav.intelligence,
    ...footerNav.organization,
  ]

  for (const item of all) {
    assert.ok(
      routeExists(item.href),
      `"${item.label}" links to ${item.href}, which has no page.tsx under app/`,
    )
  }
})

test('a section never repeats its own landing page in its children', () => {
  // The sub-panel header already links there; a duplicate row is dead weight.
  for (const item of flatten(mainNav)) {
    for (const child of item.children ?? []) {
      assert.notEqual(
        child.href,
        item.href,
        `"${item.label}" lists its own href (${item.href}) as a child`,
      )
    }
  }
})

test('no href appears twice among the top-level sections', () => {
  const hrefs = mainNav.map((item) => item.href)
  assert.equal(new Set(hrefs).size, hrefs.length)
})

test('desktopNav drops the entries the one-line bar cannot fit', () => {
  assert.ok(mainNav.some((item) => item.desktopHidden), 'nothing is marked desktopHidden')
  assert.ok(!desktopNav.some((item) => item.desktopHidden))
  // Home is on the logo and Missions lives in the footer — neither may push the
  // desktop row past the width where it starts colliding (~1080px).
  assert.deepEqual(
    desktopNav.map((item) => item.label),
    ['Articles', 'Explore', 'Live', 'Learn', 'Gallery', 'About'],
  )
})

test('every top-level section has a description for the mega-menu', () => {
  // For Home, Missions and Learn this line IS the mega-menu's middle column —
  // they have no children — so a missing one leaves a visibly empty panel.
  for (const item of mainNav) {
    assert.ok(item.description, `"${item.label}" has no description`)
    assert.ok(
      item.description!.length <= 130,
      `"${item.label}" description is ${item.description!.length} chars; it has to fit two lines`,
    )
  }
})

test('isCurrent: Home matches only the home page', () => {
  assert.equal(isCurrent('/', '/'), true)
  assert.equal(isCurrent('/articles', '/'), false)
  assert.equal(isCurrent('/live/launches', '/'), false)
})

test('isCurrent: a section covers its own sub-paths', () => {
  assert.equal(isCurrent('/live', '/live'), true)
  assert.equal(isCurrent('/live/launches', '/live'), true)
  assert.equal(isCurrent('/live/deep-space/voyager-1', '/live'), true)
})

test('isCurrent: matches whole segments, not string prefixes', () => {
  // The two that would actually bite: /lunar-sim is not inside /live, and the
  // plural listing is not an ancestor of the singular detail page.
  assert.equal(isCurrent('/lunar-sim', '/live'), false)
  assert.equal(isCurrent('/article/some-slug', '/articles'), false)
  assert.equal(isCurrent('/gallery/apod', '/gallery'), true)
})

test('sectionIsCurrent: a section stays marked from any depth below it', () => {
  const explore = mainNav.find((item) => item.label === 'Explore')!
  assert.equal(sectionIsCurrent('/explore', explore), true)
  assert.equal(sectionIsCurrent('/explore/sky-tonight', explore), true)
  // Three levels down: Explore → Topic Hubs → the hub itself.
  assert.equal(sectionIsCurrent('/explore/topics/black-holes', explore), true)
  assert.equal(sectionIsCurrent('/learn', explore), false)
})

test('sectionIsCurrent: a child on a different path still marks its parent', () => {
  // /hi/articles sits under Articles in the tree but nowhere near it in the URL
  // space, so only the recursive walk can find it.
  const articles = mainNav.find((item) => item.label === 'Articles')!
  assert.equal(sectionIsCurrent('/hi/articles', articles), true)

  const live = mainNav.find((item) => item.label === 'Live')!
  assert.equal(sectionIsCurrent('/lunar-sim', live), true)
})

test('the topic hubs come from the registry, not a hand-written copy', () => {
  const explore = mainNav.find((item) => item.label === 'Explore')!
  const hubs = explore.children?.find((child) => child.label === 'Topic Hubs')
  assert.ok(hubs?.children?.length, 'Topic Hubs has no children')
  for (const hub of hubs!.children!) {
    assert.match(hub.href, /^\/explore\/topics\/[a-z0-9-]+$/)
  }
})

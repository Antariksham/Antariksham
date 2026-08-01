/**
 * Every public English route must have a Hindi twin.
 *
 * This is the guard that makes the twin-per-route architecture safe. The
 * language switch in the nav is unconditional — it turns ANY path into its
 * counterpart — so a route added under app/ without a matching app/hi/ route
 * does not degrade gracefully, it 404s a Hindi reader. Nothing about writing a
 * new page reminds you to add the twin, so a test does.
 *
 * Run with:
 *     node --test --experimental-strip-types app/routeParity.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const APP = new URL('.', import.meta.url).pathname

/** Route paths under a directory, as URL paths ('' is the segment root). */
function routesUnder(dir: string, prefix = ''): string[] {
  let found: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return found
  }

  if (entries.includes('page.tsx')) found.push(prefix || '/')

  for (const entry of entries) {
    const full = join(dir, entry)
    if (!statSync(full).isDirectory()) continue
    // Route groups (x) do not appear in the URL; private folders (_x) are not routes.
    if (entry.startsWith('_')) continue
    if (entry.startsWith('(') && entry.endsWith(')')) {
      found = found.concat(routesUnder(full, prefix))
      continue
    }
    found = found.concat(routesUnder(full, `${prefix}/${entry}`))
  }
  return found
}

/**
 * Routes that deliberately have no Hindi twin.
 *  • /admin — the CMS is English-only by design and is excluded from the switch.
 *  • /auth  — an OAuth callback, not a page a reader ever sees.
 *  • /hi    — the Hindi tree itself.
 */
const EXCLUDED = /^\/(admin|auth|hi)(\/|$)/

test('every public English route has a Hindi twin', () => {
  const english = routesUnder(APP).filter(r => !EXCLUDED.test(r))
  const hindi   = new Set(routesUnder(join(APP, 'hi')))

  const missing = english.filter(r => !hindi.has(r))

  assert.deepEqual(
    missing, [],
    `Missing Hindi twins under app/hi:\n${missing.map(r => `  app/hi${r === '/' ? '' : r}/page.tsx`).join('\n')}\n` +
    'The nav language switch maps any path to its counterpart, so a missing ' +
    'twin 404s a Hindi reader rather than degrading.',
  )
})

test('no Hindi route exists without its English original', () => {
  // The reverse direction: a renamed or deleted English route leaves an orphan
  // twin that the switch can still reach but nothing links to.
  const english = new Set(routesUnder(APP).filter(r => !EXCLUDED.test(r)))
  const orphans = routesUnder(join(APP, 'hi')).filter(r => !english.has(r))

  assert.deepEqual(
    orphans, [],
    `Hindi routes with no English original:\n${orphans.map(r => `  app/hi${r === '/' ? '' : r}`).join('\n')}`,
  )
})

test('the route scanner actually found the site', () => {
  // A guard on the guard: if the traversal broke, both tests above would pass
  // vacuously on two empty lists.
  const english = routesUnder(APP).filter(r => !EXCLUDED.test(r))
  assert.ok(english.length > 20, `expected the public route tree, found ${english.length}`)
  assert.ok(english.includes('/'),         'home route not found')
  assert.ok(english.includes('/articles'), '/articles not found')
})

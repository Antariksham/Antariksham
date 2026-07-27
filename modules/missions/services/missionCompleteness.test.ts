/**
 * Unit tests for Mission Completeness & Validation (Phase 1, Feature 8).
 *
 *   node --test --experimental-strip-types modules/missions/services/missionCompleteness.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evaluateCompleteness, scoreColor, CHECKLIST, type MissionSnapshot } from './missionCompleteness.ts'
import { emptyIdentity } from './missionIdentity.ts'
import { emptyClassification } from './missionClassification.ts'
import { emptySpecifications } from './missionSpecifications.ts'
import { emptyObjectives } from './missionObjectives.ts'
import { emptyLaunch } from './missionLaunch.ts'
import { emptyMedia, emptyMediaItem } from './missionMedia.ts'

function emptySnapshot(): MissionSnapshot {
  return {
    name: '', slug: '', description: '', launchDate: '', agencyId: '',
    identity: emptyIdentity(), classification: emptyClassification(),
    specifications: emptySpecifications(), objectives: emptyObjectives(),
    launch: emptyLaunch(), media: emptyMedia(), timeline: [],
  }
}

function completeSnapshot(): MissionSnapshot {
  const s = emptySnapshot()
  s.name = 'Artemis III'; s.slug = 'artemis-iii'; s.description = 'A crewed lunar landing.'
  s.launchDate = '2026-09-01'; s.agencyId = 'agency-1'
  s.identity.summary = 'First crewed south-pole landing.'; s.identity.objective = 'Land astronauts.'
  s.identity.acronym = 'A3'; s.identity.subtitle = 'Return to the Moon'; s.identity.website = 'https://nasa.gov'
  s.classification.types = ['crewed']; s.classification.destinations = ['Moon']
  s.classification.agencies.partners = ['agency-2']
  s.specifications.launchVehicle = 'SLS Block 1'; s.specifications.spacecraftName = 'Orion'
  s.objectives.secondary = ['Characterise the regolith']
  s.launch.site = 'Kennedy Space Center'
  s.media.hero.url = 'https://a/hero.jpg'; s.media.patch.url = 'https://a/patch.png'
  s.media.gallery = [{ ...emptyMediaItem(), url: 'https://a/1.jpg' }]
  s.timeline = [{ date: '2026-09-01', title: 'Launch', description: '', completed: false }]
  return s
}

test('CHECKLIST: 13 required + 9 recommended', () => {
  assert.equal(CHECKLIST.filter(c => c.level === 'required').length, 13)
  assert.equal(CHECKLIST.filter(c => c.level === 'recommended').length, 9)
})

test('empty mission: only Status is satisfied (defaults to upcoming); low score', () => {
  const r = evaluateCompleteness(emptySnapshot())
  assert.equal(r.requiredDone, 1)                 // status
  assert.equal(r.recommendedDone, 0)
  assert.ok(r.score > 0 && r.score < 15)
  const name = r.items.find(i => i.key === 'name')!
  assert.equal(name.status, 'missing')            // required-missing → ✕
  const patch = r.items.find(i => i.key === 'patch')!
  assert.equal(patch.status, 'warning')           // recommended-missing → ⚠
  const status = r.items.find(i => i.key === 'status')!
  assert.equal(status.status, 'done')             // ✓
})

test('complete mission: score 100, everything done', () => {
  const r = evaluateCompleteness(completeSnapshot())
  assert.equal(r.score, 100)
  assert.equal(r.requiredDone, r.requiredTotal)
  assert.equal(r.recommendedDone, r.recommendedTotal)
  assert.ok(r.items.every(i => i.status === 'done'))
})

test('required weighs double: all-required-but-no-recommended beats the inverse', () => {
  const reqOnly = completeSnapshot()
  // strip recommended-only signals
  reqOnly.identity.acronym = ''; reqOnly.identity.subtitle = ''; reqOnly.identity.website = ''
  reqOnly.classification.agencies.partners = []
  reqOnly.specifications.spacecraftName = ''   // launchVehicle stays (required)
  reqOnly.objectives.secondary = []
  reqOnly.launch.site = ''
  reqOnly.media.patch.url = ''; reqOnly.media.gallery = []
  const r1 = evaluateCompleteness(reqOnly)
  assert.equal(r1.requiredDone, r1.requiredTotal)
  assert.equal(r1.recommendedDone, 0)
  // 2*13 / (2*13 + 9) = 26/35 ≈ 74
  assert.ok(r1.score >= 70 && r1.score < 80)
})

test('a partial mission scores in between', () => {
  const s = emptySnapshot()
  s.name = 'X'; s.slug = 'x'; s.description = 'd'
  const r = evaluateCompleteness(s)
  assert.ok(r.score > 5 && r.score < 60)
})

test('scoreColor bands', () => {
  assert.equal(scoreColor(90), 'var(--green)')
  assert.equal(scoreColor(60), 'var(--gold)')
  assert.equal(scoreColor(20), 'var(--red)')
})

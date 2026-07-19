'use client'

// 3-D view of the SELENE descent (Three.js). Pure renderer: every frame
// it reads the latest state vector the C++ flight software produced (via
// stateRef, no physics here) and poses the lander, flame, chase camera
// and trajectory trail.
//
// The surface is procedurally generated per mission (seeded simplex
// noise + craters, see services/proceduralTerrain.ts). The flight
// software's world is planar (downrange x, altitude y); the scene maps
// it onto the 3-D terrain by rotating the terrain group so the mission's
// safe zone lies on the +x flight axis, and shifting it vertically so
// the surface height at the landing target is exactly zero — the sim's
// touchdown plane. A holographic marker shows where the lander is
// aiming (the post-divert target when HDA moved the site).
//
// Sim frame → scene frame: downrange x → +x, altitude → +y, the planar
// pitch rotates about z (pitch 0 = thrust straight up, positive pitch
// tilts thrust toward +x, so rotation.z = -pitch).
//
// Loaded only on /lunar-sim via next/dynamic({ ssr: false }) so the
// WebGL bundle never reaches other routes (MIGRATION.md §10 pattern).
// Colors inside the canvas are scene lighting/material constants (a
// rendered picture, same in both themes), not UI design tokens.

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { SeleneScenarioConfig, SeleneSimState } from '../services/loadSelene'
import { mulberry32, type SafeZone, type TerrainData } from '../services/proceduralTerrain'

interface Props {
  stateRef: React.MutableRefObject<SeleneSimState | null>
  scenario: SeleneScenarioConfig
  terrain: TerrainData
  safeZone: SafeZone
  targetM: number
  runId: number
}

const TRAIL_MAX = 6000
const LANDER_SCALE = 2 // cinematic license: keeps the 4 m vehicle legible from afar
const TERRAIN_SEGMENTS = 300

// ── Procedural moon texture: gray base + crater blotches ────────────
function makeMoonTexture(): THREE.CanvasTexture {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#8d8d92'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 4 + Math.random() * 34
    const g = ctx.createRadialGradient(x, y, r * 0.25, x, y, r)
    g.addColorStop(0, 'rgba(60,60,66,0.55)')
    g.addColorStop(0.7, 'rgba(150,150,156,0.25)')
    g.addColorStop(1, 'rgba(141,141,146,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(6, 6)
  return tex
}

// ── Terrain mesh: PlaneGeometry displaced by the mission height field ─
function makeTerrainMesh(terrain: TerrainData, moonTex: THREE.Texture): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(
    terrain.sizeM, terrain.sizeM, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS,
  )
  const pos = geo.attributes.position as THREE.BufferAttribute
  // The mesh is rotated -90° about x, so plane-local (x, y) lands at
  // world (x, -y): sample the height field with the flipped ordinate.
  for (let i = 0; i < pos.count; i++) {
    pos.setZ(i, terrain.heightAt(pos.getX(i), -pos.getY(i)))
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      map: moonTex, bumpMap: moonTex, bumpScale: 1.6, roughness: 1,
    }),
  )
  mesh.rotation.x = -Math.PI / 2
  return mesh
}

// ── Rocks scattered deterministically from the terrain seed ──────────
function makeRockField(terrain: TerrainData): THREE.Group {
  const group = new THREE.Group()
  const rand = mulberry32(terrain.seed ^ 0x5eed50c5)
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x77777d, roughness: 0.95 })
  const rockGeo = new THREE.DodecahedronGeometry(1, 0)
  for (let i = 0; i < 160; i++) {
    const rock = new THREE.Mesh(rockGeo, rockMat)
    const s = 0.4 + rand() * 2.6
    rock.scale.set(s, s * (0.5 + rand() * 0.5), s)
    const x = (rand() * 2 - 1) * 1800
    const z = (rand() * 2 - 1) * 1800
    rock.position.set(x, terrain.heightAt(x, z) + s * 0.2, z)
    rock.rotation.y = rand() * Math.PI
    group.add(rock)
  }
  return group
}

// ── Holographic landing-target marker (ring + pulsing beacon beam) ───
function makeTargetMarker(): THREE.Group {
  const group = new THREE.Group()
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(9, 13, 48),
    new THREE.MeshBasicMaterial({
      color: 0x2ecc71, transparent: true, opacity: 0.75, side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.2
  group.add(ring)

  const innerRing = new THREE.Mesh(
    new THREE.RingGeometry(3, 4.2, 32),
    new THREE.MeshBasicMaterial({
      color: 0x9ef7c6, transparent: true, opacity: 0.9, side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  innerRing.rotation.x = -Math.PI / 2
  innerRing.position.y = 0.25
  group.add(innerRing)

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 8, 260, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x2ecc71, transparent: true, opacity: 0.14,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }),
  )
  beam.position.y = 130
  group.add(beam)
  return group
}

// ── Lander built from primitives (box body, four legs, nozzle) ──────
function makeLander(): { group: THREE.Group; flame: THREE.Mesh } {
  const group = new THREE.Group()
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd8d3c4, roughness: 0.6, metalness: 0.35 })
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.45, metalness: 0.7 })
  const legMat = new THREE.MeshStandardMaterial({ color: 0x8f8f96, roughness: 0.8 })

  const descent = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 1.1, 8), goldMat)
  descent.position.y = 1.0
  group.add(descent)

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.3, 1.9), bodyMat)
  cabin.position.y = 2.2
  group.add(cabin)

  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.75, 0.8, 12, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x4a4a52, roughness: 0.5, metalness: 0.8, side: THREE.DoubleSide }))
  nozzle.position.y = 0.25
  group.add(nozzle)

  for (let i = 0; i < 4; i++) {
    const a = (Math.PI / 4) + (i * Math.PI) / 2
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.3), legMat)
    leg.position.set(Math.cos(a) * 1.6, 0.9, Math.sin(a) * 1.6)
    leg.rotation.z = Math.cos(a) * 0.62
    leg.rotation.x = -Math.sin(a) * 0.62
    group.add(leg)
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 10), legMat)
    pad.position.set(Math.cos(a) * 2.25, 0.05, Math.sin(a) * 2.25)
    group.add(pad)
  }

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 3.2, 12),
    new THREE.MeshBasicMaterial({
      color: 0xffb347, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  )
  flame.rotation.x = Math.PI // apex down
  flame.position.y = -1.4
  group.add(flame)

  group.scale.setScalar(LANDER_SCALE)
  return { group, flame }
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
    else if (mat) mat.dispose()
  })
}

export default function LunarScene({ stateRef, scenario, terrain, safeZone, targetM, runId }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [webglFailed, setWebglFailed] = useState(false)
  // Scene objects that later effects / the render loop need to reach.
  const worldRef = useRef<{
    scene?: THREE.Scene
    moonTex?: THREE.Texture
    terrainGroup?: THREE.Group
    terrainData?: TerrainData
    marker?: THREE.Group
    hazardPatch?: THREE.Group
    trail?: THREE.Line
    trailPositions?: Float32Array
    trailCount?: number
    resetTrail?: () => void
  }>({})

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    } catch {
      setWebglFailed(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.appendChild(renderer.domElement)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x050508)
    const camera = new THREE.PerspectiveCamera(52, 1, 0.5, 20000)
    camera.position.set(-120, 260, 420)

    // Stark lunar lighting: one sun, faint earthshine fill.
    const sun = new THREE.DirectionalLight(0xffffff, 2.6)
    sun.position.set(-900, 1400, 700)
    scene.add(sun)
    scene.add(new THREE.AmbientLight(0x8899bb, 0.22))

    // Starfield.
    {
      const n = 1800
      const pos = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) {
        const v = new THREE.Vector3().randomDirection().multiplyScalar(9000)
        pos.set([v.x, Math.abs(v.y), v.z], i * 3) // keep stars above the horizon
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
        color: 0xdfe4ee, size: 2.2, sizeAttenuation: false,
      })))
    }

    const moonTex = makeMoonTexture()

    // Procedural terrain lives in its own group so each mission can swap
    // the mesh and the group can be rotated/offset into the sim frame.
    const terrainGroup = new THREE.Group()
    scene.add(terrainGroup)

    // Holographic landing-target marker (repositioned per run below).
    const marker = makeTargetMarker()
    scene.add(marker)

    // Hazard patch for the boulder-field demo toggle: scorched circle +
    // boulders dropped on the nominal site.
    const hazardPatch = new THREE.Group()
    const scorch = new THREE.Mesh(
      new THREE.CircleGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x3d2320, roughness: 1 }),
    )
    scorch.rotation.x = -Math.PI / 2
    scorch.position.y = 0.12
    hazardPatch.add(scorch)
    const boulderGeo = new THREE.DodecahedronGeometry(1, 0)
    for (let i = 0; i < 26; i++) {
      const b = new THREE.Mesh(boulderGeo, new THREE.MeshStandardMaterial({ color: 0x55322c, roughness: 1 }))
      const s = 1 + Math.random() * 3
      b.scale.setScalar(s)
      const r = Math.random() * 36
      const a = Math.random() * Math.PI * 2
      b.position.set(Math.cos(a) * r, s * 0.4, Math.sin(a) * r * 0.5)
      hazardPatch.add(b)
    }
    scene.add(hazardPatch)

    // Trajectory trail.
    const trailPositions = new Float32Array(TRAIL_MAX * 3)
    const trailGeo = new THREE.BufferGeometry()
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
    trailGeo.setDrawRange(0, 0)
    const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({
      color: 0x4f8ef7, transparent: true, opacity: 0.65,
    }))
    trail.frustumCulled = false
    scene.add(trail)

    const { group: lander, flame } = makeLander()
    scene.add(lander)

    const world = worldRef.current
    world.scene = scene
    world.moonTex = moonTex
    world.terrainGroup = terrainGroup
    world.marker = marker
    world.hazardPatch = hazardPatch
    world.trail = trail
    world.trailPositions = trailPositions
    world.trailCount = 0
    world.resetTrail = () => {
      world.trailCount = 0
      trailGeo.setDrawRange(0, 0)
    }

    // Responsive sizing.
    const resize = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      if (w === 0 || h === 0) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    // Render loop: pose everything from the latest C++ state vector.
    const camGoal = new THREE.Vector3()
    const lookGoal = new THREE.Vector3()
    let rafId = 0
    const frame = (now: number) => {
      rafId = requestAnimationFrame(frame)

      // Holographic marker pulse (render-time animation, no physics).
      const pulse = 0.5 + 0.5 * Math.sin(now / 350)
      const ringMesh = marker.children[0] as THREE.Mesh
      const beamMesh = marker.children[2] as THREE.Mesh
      ;(ringMesh.material as THREE.MeshBasicMaterial).opacity = 0.45 + 0.35 * pulse
      ;(beamMesh.material as THREE.MeshBasicMaterial).opacity = 0.08 + 0.10 * pulse
      marker.rotation.y = now / 2400

      const s = stateRef.current
      if (s) {
        const x = s.downrangeM
        const y = s.altitudeM
        lander.position.set(x, y, 0)
        lander.rotation.z = -s.pitchRad

        const throttled = s.throttleFrac > 0.01 && !s.touchedDown
        flame.visible = throttled
        if (throttled) {
          const flicker = 0.85 + Math.random() * 0.3
          flame.scale.set(1, s.throttleFrac * flicker, 1)
          flame.position.y = -1.4 - (1.6 * s.throttleFrac * flicker) / 2
        }

        // Trail: record every few meters of travel.
        const tp = world.trailPositions!
        const n = world.trailCount!
        const lastX = n > 0 ? tp[(n - 1) * 3] : Infinity
        const lastY = n > 0 ? tp[(n - 1) * 3 + 1] : Infinity
        if (n < TRAIL_MAX && (Math.abs(x - lastX) > 3 || Math.abs(y - lastY) > 3)) {
          tp.set([x, y + 2 * LANDER_SCALE, 0], n * 3)
          world.trailCount = n + 1
          trail.geometry.setDrawRange(0, n + 1)
          trail.geometry.attributes.position.needsUpdate = true
        }

        // Chase camera: pulls in as the surface approaches.
        const dist = Math.min(30 + y * 0.09, 220)
        camGoal.set(x - 12 - y * 0.035, y + 7 + y * 0.055, dist)
        lookGoal.set(x, y + 3, 0)
        camera.position.lerp(camGoal, 0.06)
        const look = new THREE.Vector3().copy(lookGoal)
        camera.lookAt(look)
      }
      renderer.render(scene, camera)
    }
    rafId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      renderer.dispose()
      moonTex.dispose()
      disposeObject(scene)
      host.removeChild(renderer.domElement)
      worldRef.current = {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Rebuild the surface when a new mission generates new terrain.
  useEffect(() => {
    const world = worldRef.current
    const group = world.terrainGroup
    if (!group || !world.moonTex) return
    if (world.terrainData === terrain) return
    while (group.children.length > 0) {
      const child = group.children[0]
      group.remove(child)
      disposeObject(child)
    }
    group.add(makeTerrainMesh(terrain, world.moonTex))
    group.add(makeRockField(terrain))
    world.terrainData = terrain
  }, [terrain])

  // Stage the world for the current run: rotate the terrain so the safe
  // zone lies on the +x flight axis, drop the surface so the landing
  // target sits at altitude zero, and place the markers.
  useEffect(() => {
    const world = worldRef.current
    const group = world.terrainGroup
    if (!group) return

    const az = safeZone.azimuthRad
    // Surface height under a sim downrange coordinate d: the flight axis
    // maps back to the terrain-local ray toward the safe zone.
    const groundAt = (d: number) => terrain.heightAt(Math.cos(az) * d, Math.sin(az) * d)

    group.rotation.y = az
    // Zero the surface at the flown target: the FSW touches down at
    // altitude 0 exactly where the marker stands.
    const drop = -groundAt(targetM)
    group.position.y = drop

    world.marker?.position.set(targetM, 0, 0)
    if (world.hazardPatch) {
      world.hazardPatch.visible = scenario.hazardAtTarget
      world.hazardPatch.position.set(
        scenario.targetDownrangeM, groundAt(scenario.targetDownrangeM) + drop, 0,
      )
    }
    world.resetTrail?.()
  }, [runId, targetM, terrain, safeZone, scenario.hazardAtTarget, scenario.targetDownrangeM])

  if (webglFailed) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: 'var(--dim)', textAlign: 'center', padding: '2rem',
      }}>
        WebGL is unavailable in this browser — the telemetry dashboard below is still live.
      </div>
    )
  }
  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />
}

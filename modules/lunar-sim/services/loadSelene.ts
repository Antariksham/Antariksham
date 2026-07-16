// Loader + typings for the SELENE flight-software WebAssembly bridge.
//
// The artifacts in /public/wasm (selene_fsw.js + selene_fsw.wasm) are built
// from the C++ repo (antariksham/moon-landing-code, wasm/build.sh) and are
// republished automatically by that repo's CI on every push to its main
// branch. All descent physics and GNC decisions happen inside the module;
// the frontend only renders the state vectors it reads back.

export interface SeleneScenarioConfig {
  gateAltitudeM: number
  gateVelocityXMps: number
  gateVelocityZMps: number
  targetDownrangeM: number
  perfectNav: boolean
  hazardAtTarget: boolean
}

export const DEFAULT_SCENARIO: SeleneScenarioConfig = {
  gateAltitudeM: 2000,
  gateVelocityXMps: 60,
  gateVelocityZMps: -30,
  targetDownrangeM: 1200,
  perfectNav: false,
  hazardAtTarget: false,
}

export interface SeleneSimState {
  timeS: number
  altitudeM: number
  downrangeM: number
  velocityXMps: number
  velocityZMps: number
  velocityXCmdMps: number
  velocityZCmdMps: number
  pitchRad: number
  pitchCmdRad: number
  throttleFrac: number
  torqueFrac: number
  massKg: number
  navAltitudeM: number
  navVelocityZMps: number
  missionPhase: number
  touchedDown: boolean
}

export interface SeleneSimResult {
  valid: boolean
  touchedDown: boolean
  safeLanding: boolean
  touchdownVerticalSpeedMps: number
  touchdownHorizontalSpeedMps: number
  touchdownTiltDeg: number
  touchdownMissM: number
  finalTargetDownrangeM: number
  hdaDiverted: boolean
  hdaDivertDistanceM: number
  hdaNoSafeSite: boolean
  landedOnHazard: boolean
  flightTimeS: number
  propellantUsedKg: number
  finalPhase: number
  controllerFaultCount: number
  navAltitudeErrorM: number
  navVelocityErrorMps: number
}

export interface SeleneModule {
  runDefaultScenario(): boolean
  runScenario(cfg: SeleneScenarioConfig): boolean
  getStateAtTime(tS: number): SeleneSimState
  getResult(): SeleneSimResult
  getFlightTimeS(): number
  getSampleCount(): number
}

// Mission phases mirror lls::fsw::MissionPhase (values are telemetry-stable).
export const MISSION_PHASES = [
  'BOOT', 'STANDBY', 'DEORBIT', 'BRAKING', 'APPROACH',
  'TERMINAL DESCENT', 'TOUCHDOWN', 'SAFED', 'SAFE MODE',
] as const

export function phaseName(phase: number): string {
  return MISSION_PHASES[phase] ?? `PHASE ${phase}`
}

type SeleneFactory = (opts?: {
  locateFile?: (file: string) => string
}) => Promise<SeleneModule>

declare global {
  interface Window { createSeleneModule?: SeleneFactory }
}

let modulePromise: Promise<SeleneModule> | null = null

/**
 * Load /wasm/selene_fsw.js via a script tag (the Emscripten MODULARIZE
 * loader), then instantiate the wasm module. Cached after the first call;
 * a failed load clears the cache so a remount can retry.
 */
export function loadSelene(): Promise<SeleneModule> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('SELENE wasm bridge is client-side only'))
  }
  if (!modulePromise) {
    modulePromise = new Promise<SeleneModule>((resolve, reject) => {
      const instantiate = () => {
        if (!window.createSeleneModule) {
          reject(new Error('selene_fsw.js loaded but createSeleneModule is missing'))
          return
        }
        window
          .createSeleneModule({ locateFile: (f) => `/wasm/${f}` })
          .then(resolve, reject)
      }
      if (window.createSeleneModule) { instantiate(); return }
      const script = document.createElement('script')
      script.src = '/wasm/selene_fsw.js'
      script.async = true
      script.onload = instantiate
      script.onerror = () => reject(new Error('Could not fetch /wasm/selene_fsw.js'))
      document.head.appendChild(script)
    })
    modulePromise.catch(() => { modulePromise = null })
  }
  return modulePromise
}

---
name: verify
description: Build/launch/drive recipe for verifying Antariksham changes end-to-end in this environment.
---

# Verifying Antariksham changes

## Build gate
- `npm ci && npm run build` — must reach `✓ Compiled successfully` (types are
  checked here too). The subsequent `supabaseUrl is required` page-data error
  is EXPECTED (missing env, CLAUDE.md rule 8) — not a failure.

## Run + drive (headless browser)
- Dev server: `npm run dev -- --port <port>` (pages work without Supabase env;
  only `/api/admin/*` routes fail at import).
- Playwright: install `playwright-core` in a scratch dir (do NOT
  `playwright install`) and launch with
  `executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'`
  (the `/opt/pw-browsers/chromium` symlinked path does not exist; `ls` for
  the current `chromium-*` version dir).
- Both themes: light mode is
  `document.documentElement.setAttribute('data-theme', 'light')`.

## Gotchas
- Console shows `ERR_CONNECTION_RESET` for `cdn.jsdelivr.net/npm/katex...` —
  the sandbox proxy blocks that CDN. Pre-existing noise, ignore.
- `/lunar-sim`: wasm artifacts must exist in `public/wasm/`. Flight playback
  is real-time; click the `× speed` button twice (4×) to reach touchdown in
  ~15–25 s. Watch `[lunar-sim]` console logs for mission seed / TOUCHDOWN.
  Mission scoreboard persists in localStorage key
  `cosmosdaily.lunar-sim.stats.v1`.
- Rebuilding the wasm needs emsdk (not preinstalled): clone
  `emscripten-core/emsdk`, `install latest && activate latest`, then run the
  FSW repo's `wasm/build.sh --test` and copy `wasm/dist/*` to `public/wasm/`.

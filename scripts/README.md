# scripts

One-off maintenance scripts. Not part of the Next build — nothing here runs on
Vercel, and none of it is a dependency of the app.

## `generate-icons.mjs` — rasterise the brand mark

Regenerates the PNG icons that a PWA manifest and iOS require, from the same
path data as `components/brand/Logo.tsx`:

```bash
npm i --no-save sharp && node scripts/generate-icons.mjs
```

Writes `public/icons/icon-192.png`, `public/icons/icon-512.png`,
`public/icons/icon-maskable-512.png` and `app/apple-icon.png`. The outputs are
committed, so a normal checkout never needs `sharp` — run this only when the
mark's shape changes. See the header comment in the script for why the maskable
icon is a separate file and why the Apple one is flattened.

---

### Removed: `migrate-cosmosdaily-articles.mjs`

Antariksham is an independent site; there is no CosmosDaily project to import
from, and no cutover to stage. The script and its runbook were deleted rather
than left to rot — `git log -- scripts/migrate-cosmosdaily-articles.mjs` has
them if the history is ever wanted.
